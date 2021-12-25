data "aws_region" "current" {}

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
  name               = "ecs-staging-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "template_file" "api" {
  template = file("${path.module}/api.json.tpl")
  vars = {
    api_name           = var.app_name
    aws_ecr_repository = var.repository_url
    tag                = "latest"
    region             = data.aws_region.current.name
    map_bucket         = var.maps_bucket
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "api-staging"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  cpu                      = 256
  memory                   = 2048
  requires_compatibilities = ["FARGATE"]
  container_definitions    = data.template_file.api.rendered
}

resource "aws_ecs_cluster" "staging" {
  name = "api-cluster"
}

resource "aws_ecs_service" "staging" {
  name            = "${var.app_name}-api"
  cluster         = aws_ecs_cluster.staging.id
  task_definition = aws_ecs_task_definition.api.arn
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = [for subnet in aws_subnet.main_subnet : subnet.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.staging.arn
    container_name   = var.app_name
    container_port   = 8080
  }

  depends_on = [
      aws_lb_listener.https_forward, 
      aws_iam_role_policy_attachment.ecs_task_execution_role
  ]
}