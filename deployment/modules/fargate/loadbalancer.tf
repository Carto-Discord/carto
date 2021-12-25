resource "aws_lb" "staging" {
  name               = "alb"
  subnets            =  [for subnet in aws_subnet.main_subnet : subnet.id]
  load_balancer_type = "application"
  security_groups    = [aws_security_group.load_balancer.id]
}

resource "aws_lb_listener" "https_forward" {
  load_balancer_arn = aws_lb.staging.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.staging.arn
  }
}

resource "aws_lb_target_group" "staging" {
  name        = "api-alb-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.carto_vpc.id
  target_type = "ip"
}