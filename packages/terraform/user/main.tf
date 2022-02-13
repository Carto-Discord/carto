variable "app_name" {
  default = "carto"
}

resource "aws_iam_user" "terraform" {
  name = "${var.app_name}-terraform"
}

resource "aws_iam_access_key" "key" {
  user = aws_iam_user.terraform.name
}

resource "aws_iam_group" "deployer" {
  name = "${var.app_name}-deployer"
}

resource "aws_iam_group_membership" "deployers" {
  name = "${var.app_name}-deployer-group-membership"

  users = [
    aws_iam_user.terraform.name
  ]

  group = aws_iam_group.deployer.name
}

resource "aws_iam_user_policy" "s3backend" {
  name = "${var.app_name}-TerraformBackendAccess"
  user = aws_iam_user.terraform.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:ListBucket",
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.backend.arn}"
      },
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.backend.arn}/terraform.tfstate"
      },
    ]
  })
}

resource "aws_iam_group_policy" "s3" {
  name  = "${var.app_name}-DeployS3Bucket"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:DeleteBucketPolicy",
          "s3:Get*",
          "s3:PutBucketAcl",
          "s3:PutBucketPolicy",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_group_policy" "dynamodb" {
  name  = "${var.app_name}-DeployDynamoDBTables"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:Describe*",
          "dynamodb:List*",
          "dynamodb:TagResource"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_group_policy" "apigateway" {
  name  = "${var.app_name}-DeployAPIGateway"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "APIGatewayAdmin"
        Action = [
          "apigateway:GET",
          "apigateway:PATCH",
          "apigateway:POST",
          "apigateway:DELETE"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:apigateway:*::/*"
      },
      {
        Sid = "Logs"
        Action = [
          "logs:CreateLogDelivery",
          "logs:ListLogDeliveries",
          "logs:DeleteLogDelivery"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "lambda" {
  name  = "${var.app_name}-DeployLambda"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadOnlyPermissions"
        Effect = "Allow"
        Action = [
          "lambda:GetAccountSettings",
          "lambda:GetEventSourceMapping",
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:GetFunctionCodeSigningConfig",
          "lambda:GetFunctionConcurrency",
          "lambda:ListEventSourceMappings",
          "lambda:ListFunctions",
          "lambda:ListTags",
          "iam:ListRoles"
        ]
        Resource = "*"
      },
      {
        Sid    = "DevelopFunctions"
        Effect = "Allow"
        NotAction = [
          "lambda:PutFunctionConcurrency"
        ]
        Resource = "arn:aws:lambda:*:*:function:carto-bot-*"
      },
      {
        Sid    = "DevelopEventSourceMappings"
        Effect = "Allow"
        Action = [
          "lambda:DeleteEventSourceMapping",
          "lambda:UpdateEventSourceMapping",
          "lambda:CreateEventSourceMapping"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "lambda:FunctionArn" = "arn:aws:lambda:*:*:function:carto-bot-*"
          }
        }
      },
      {
        Sid    = "PassExecutionRole"
        Effect = "Allow"
        Action = [
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:PassRole",
          "iam:SimulatePrincipalPolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "ViewLogs"
        Effect = "Allow"
        Action = [
          "logs:*"
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/carto-bot-*"
      },
    ]
  })
}

resource "aws_iam_group_policy" "cloudwatch" {
  name  = "${var.app_name}-CreateCloudwatchLogGroups"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:DescribeLogGroups",
          "logs:ListTagsLogGroup",
          "logs:PutRetentionPolicy"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}

resource "aws_iam_group_policy" "iam" {
  name  = "${var.app_name}-ManageIAMRoles"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "iam:AttachRolePolicy",
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:DeletePolicy",
          "iam:DeletePolicyVersion",
          "iam:DeleteRolePolicy",
          "iam:DetachRolePolicy",
          "iam:PutRolePolicy",
          "iam:ListEntitiesForPolicy",
          "iam:ListInstanceProfilesForRole",
          "iam:ListPolicies",
          "iam:ListPolicyVersions"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "stepfunctions" {
  name  = "${var.app_name}-DeployStepFunctions"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "ManageStates"
        Action = [
          "states:CreateStateMachine",
          "states:DeleteStateMachine",
          "states:DescribeStateMachine",
          "states:ListTagsForResource",
          "states:UpdateStateMachine"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:states:*:*:*"
      },
      {
        Sid = "ManageRoles"
        Action = [
          "iam:PassRole"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:iam:::role/*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "events" {
  name  = "${var.app_name}-ManageCloudwatchEvents"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "ManageEvents"
        Action = [
          "events:DeleteRule",
          "events:DescribeRule",
          "events:ListTagsForResource",
          "events:ListTargetsByRule",
          "events:PutRule",
          "events:PutTargets",
          "events:RemoveTargets"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:events:*:*:*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "budgets" {
  name  = "${var.app_name}-ManageBudgets"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "ManageEvents"
        Action = [
          "budgets:CreateBudgetAction",
          "budgets:DeleteBudgetAction",
          "budgets:ModifyBudget",
          "budgets:ViewBudget",
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_group_policy" "alarms" {
  name  = "${var.app_name}-ManageAlarms"
  group = aws_iam_group.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid = "ManageEvents"
        Action = [
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:ListTagsForResource",
          "cloudwatch:PutMetricAlarm"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
