resource "aws_alb" "ticketing_alb" {
  name               = "ticketing-lb"
  subnets            = aws_subnet.public.*.id
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  internal           = false

}

resource "aws_lb_listener" "ticketing_http_listener" {
  load_balancer_arn = aws_alb.ticketing_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ticketing_tg.id
  }
}

resource "aws_lb_target_group" "ticketing_tg" {
  vpc_id               = aws_vpc.cluster_vpc.id
  name                 = "ticketing-tg"
  port                 = var.host_port
  protocol             = "HTTP"
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    enabled             = true
    interval            = 120
    path                = "/tickets"
    port                = 5500
    protocol            = "HTTP"
    timeout             = 5
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  lifecycle {
    create_before_destroy = true
  }
}
