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
        "containerPort": var.container_port,
        "hostPort": var.host_port,
        "protocol": "tcp",
        "appProtocol": "http"
      }
    ],
    "environment": [
      {
        "name": "REDIS_HOST",
        "value": var.REDIS_HOST
      },
      {
        "name": "DB_DIALECT",
        "value": var.DB_DIALECT
      },
      {
        "name": "REDIS_PORT",
        "value": var.REDIS_PORT
      },
      {
        "name": "DB_PORT",
        "value": var.DB_PORT
      },
      {
        "name": "DB_USER",
        "value": var.DB_USER
      },
      {
        "name": "DB_NAME",
        "value": var.DB_NAME
      },
      {
        "name": "DB_HOST",
        "value": var.DB_HOST
      },
      {
        "name": "DB_PASSWORD",
        "value": var.DB_PASSWORD
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

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"

  statement {
    sid     = ""
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "ecs-ticketing-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_service" "ticketing_service" {
  name            = "ticketing-service"
  cluster         = aws_ecs_cluster.ticketing_cluster.id
  task_definition = aws_ecs_task_definition.ticketing_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  force_new_deployment = true

  load_balancer {
    target_group_arn = aws_lb_target_group.ticketing_tg.arn
    container_name   = "web"
    container_port   = var.container_port
  }

  network_configuration {
    subnets          = aws_subnet.public.*.id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  depends_on = [
    aws_lb_listener.ticketing_http_listener,
  ]
}
