terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "ap-northeast-2"
}

resource "aws_ecs_cluster" "ticketing_cluster" {
  name = "ticketing-cluster"
  capacity_providers = ["FARGATE"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

resource "aws_cloudwatch_log_group" "ticketing_logs" {
  name = "/ecs/ticketing-cluster"
}

resource "aws_cloudwatch_log_stream" "ticketing_log_stream" {
  name           = "ticketing-task"
  log_group_name = aws_cloudwatch_log_group.ticketing_logs.name
}


resource "aws_ecs_task_definition" "ticketing_task" {
  family                   = "ticketing-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "4096"
  execution_role_arn       = "arn:aws:iam::829235619109:role/ecsTaskExecutionRole"
  task_role_arn            = "arn:aws:iam::829235619109:role/ecsTaskExecutionRole"

  volume {
    name = "web_vol"
  }

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  container_definitions = <<DEFINITION
[
  {
    "name": "web",
    "image": "829235619109.dkr.ecr.ap-northeast-2.amazonaws.com/ticketing:latest",
    "cpu": 1024,
    "memory": 4096,
    "essential": true,
    "portMappings": [
      {
        "containerPort": 5500,
        "hostPort": 5500,
        "protocol": "tcp",
        "appProtocol": "http"
      }
    ],
    "environment": [
      {
        "name": "REDIS_HOST",
        "value": "43.203.204.177"
      },
      {
        "name": "DB_DIALECT",
        "value": "postgres"
      },
      {
        "name": "REDIS_PORT",
        "value": "6379"
      },
      {
        "name": "DB_PORT",
        "value": "5432"
      },
      {
        "name": "DB_USER",
        "value": "root"
      },
      {
        "name": "DB_NAME",
        "value": "test_db"
      },
      {
        "name": "DB_HOST",
        "value": "43.200.70.70"
      },
      {
        "name": "DB_PASSWORD",
        "value": "root"
      }
    ],
    "mountPoints": [
                {
                    "sourceVolume": "web_vol",
                    "containerPath": "/app/src",
                    "readOnly": false
                }
            ],
    "volumesFrom": [],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "${aws_cloudwatch_log_group.ticketing_logs.name}",
        "awslogs-stream-prefix": "${aws_cloudwatch_log_stream.ticketing_log_stream.name}",
        "awslogs-region": "ap-northeast-2"
      }
    }
  }
]
DEFINITION
}

resource "aws_lb" "ticketing_load_balancer" {
  name               = "ticketing-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "ticketing-load-balancer"
  }
}

resource "aws_lb_target_group" "ticketing_target_group" {
  name        = "ticketing-target-group"
  port        = 5500
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/tickets"
    port                = 5500
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "aws_alb_listener" {
  load_balancer_arn = aws_lb.ticketing_load_balancer.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ticketing_target_group.arn
  }
}

resource "aws_ecs_service" "ticketing_service" {
  name            = "ticketing-service"
  cluster         = aws_ecs_cluster.ticketing_cluster.id
  task_definition = aws_ecs_task_definition.ticketing_task.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }

  force_new_deployment = true

  load_balancer {
    target_group_arn = aws_lb_target_group.ticketing_target_group.arn
    container_name   = "web"
    container_port   = 5500
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.sg_id]
    assign_public_ip = false
  }
}
