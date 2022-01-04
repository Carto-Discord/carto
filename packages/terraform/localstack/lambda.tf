resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

module "parse_command_lambda" {
  source = "../lambda"
  
  app_name = var.app_name
  function_name = "parse-command"
  runtime = "nodejs14.x"
  lambda_iam_role_arn = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "PUBLIC_KEY" = var.discord_public_key
    "STATE_MACHINE_ARN" = aws_sfn_state_machine.state_machine.arn
  }
}

module "get_map_lambda" {
  source = "../lambda"
  
  app_name = var.app_name
  function_name = "retrieve-map"
  runtime = "nodejs14.x"
  lambda_iam_role_arn = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "MAPS_BUCKET" = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE" = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "send_response_lambda" {
  source = "../lambda"
  
  app_name = var.app_name
  function_name = "send-response"
  runtime = "nodejs14.x"
  lambda_iam_role_arn = aws_iam_role.iam_for_lambda.arn
  lambda_iam_role_name = aws_iam_role.iam_for_lambda.name
  environment_variables = {
    "BASE_URL" = var.discord_base_url
  }
}