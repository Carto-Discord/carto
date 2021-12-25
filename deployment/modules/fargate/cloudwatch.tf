resource "aws_cloudwatch_log_group" "api" {
  name = "awslogs-${var.app_name}-staging"
}