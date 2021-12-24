[
  {
    "name": "${api_name}",
    "image": "${aws_ecr_repository}:${tag}",
    "essential": true,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-region": "${region}",
        "awslogs-stream-prefix": "${api_name}-staging-service",
        "awslogs-group": "awslogs-${api_name}-staging"
      }
    },
    "portMappings": [
      {
        "containerPort": 8080,
        "hostPort": 8080,
        "protocol": "tcp"
      }
    ],
    "cpu": 1,
    "environment": [
      {
        "name": "PORT",
        "value": "8080"
      },
      {
        "name": "MAP_BUCKET",
        "value": "${map_bucket}"
      },
      {
        "name": "AWS_DEFAULT_REGION",
        "value": "${region}"
      }
    ],
    "ulimits": [
      {
        "name": "nofile",
        "softLimit": 65536,
        "hardLimit": 65536
      }
    ],
    "mountPoints": [],
    "memory": 2048,
    "volumesFrom": []
  }
]