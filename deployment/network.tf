resource "aws_vpc" "carto_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_internet_gateway" "gateway" {
  vpc_id = aws_vpc.carto_vpc.id
}

resource "aws_subnet" "main_subnet" {
  count             = 3
  vpc_id            = aws_vpc.carto_vpc.id
  availability_zone = element(var.availability_zones, count.index)
  cidr_block        = element(var.subnet_cidrs, count.index)
}

resource "aws_security_group" "load_balancer" {
  name        = "load-balancer-sg"
  description = "Controls access to the Application Load Balancer (ALB)"
  vpc_id      = aws_vpc.carto_vpc.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = [aws_vpc.carto_vpc.cidr_block]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "ecs-tasks-sg"
  description = "Allow inbound access from the ALB only"
  vpc_id      = aws_vpc.carto_vpc.id

  ingress {
    protocol        = "tcp"
    from_port       = 8080
    to_port         = 8080
    cidr_blocks     = [aws_vpc.carto_vpc.cidr_block]
    security_groups = [aws_security_group.load_balancer.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}