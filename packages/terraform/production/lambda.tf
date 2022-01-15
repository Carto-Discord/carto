resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "parse_command_role" {
  name = "iam_for_lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "start_state_machine" {
  name = "start_state_machine"
  role = aws_iam_role.parse_command_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "states:StartExecution"
        ]
        Effect   = "Allow"
        Resource = "${aws_sfn_state_machine.state_machine.arn}"
      }
    ]
  })
}

module "parse_command_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "parse-command"
  runtime              = "nodejs14.x"
  lambda_iam_role_arn  = aws_iam_role.parse_command_role.arn
  lambda_iam_role_name = aws_iam_role.parse_command_role.name
  environment_variables = {
    "PUBLIC_KEY"        = var.discord_public_key
    "STATE_MACHINE_ARN" = aws_sfn_state_machine.state_machine.arn
  }
}

module "get_map_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "get-map"
  runtime              = "nodejs14.x"
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "delete_map_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "delete-map"
  runtime              = "nodejs14.x"
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "create_map_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "create-map"
  runtime              = "nodejs14.x"
  timeout              = 10
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "add_token_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "add-token"
  runtime              = "nodejs14.x"
  timeout              = 10
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "move_delete_token_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "move-delete-token"
  runtime              = "nodejs14.x"
  timeout              = 10
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "send_response_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "send-response"
  runtime              = "nodejs14.x"
  lambda_iam_role_arn  = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "BASE_URL" = var.discord_base_url
  }
}
