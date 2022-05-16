module "parse_command_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "parse-command"
  runtime              = "nodejs16.x"
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
  runtime              = "nodejs16.x"
  lambda_iam_role_arn  = aws_iam_role.get_map_role.arn
  lambda_iam_role_name = aws_iam_role.get_map_role.name
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
  runtime              = "nodejs16.x"
  lambda_iam_role_arn  = aws_iam_role.delete_map_role.arn
  lambda_iam_role_name = aws_iam_role.delete_map_role.name
  environment_variables = {
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
  }
}

module "create_map_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "create-map"
  runtime              = "nodejs16.x"
  timeout              = 20
  memory_size          = 512
  lambda_iam_role_arn  = aws_iam_role.create_map_role.arn
  lambda_iam_role_name = aws_iam_role.create_map_role.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
    "LD_PRELOAD"     = var.ld_preload
  }
}

module "add_token_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "add-token"
  runtime              = "nodejs16.x"
  timeout              = 20
  memory_size          = 512
  lambda_iam_role_arn  = aws_iam_role.add_token_role.arn
  lambda_iam_role_name = aws_iam_role.add_token_role.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
    "LD_PRELOAD"     = var.ld_preload
  }
}

module "move_delete_token_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "move-delete-token"
  runtime              = "nodejs16.x"
  timeout              = 20
  memory_size          = 512
  lambda_iam_role_arn  = aws_iam_role.move_delete_token_role.arn
  lambda_iam_role_name = aws_iam_role.move_delete_token_role.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
    "LD_PRELOAD"     = var.ld_preload
  }
}

module "send_response_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "send-response"
  runtime              = "nodejs16.x"
  lambda_iam_role_arn  = aws_iam_role.send_response_role.arn
  lambda_iam_role_name = aws_iam_role.send_response_role.name
  environment_variables = {
    "BASE_URL" = var.discord_base_url
  }
}

module "janitor_lambda" {
  source = "../lambda"

  app_name             = var.app_name
  function_name        = "janitor"
  runtime              = "nodejs16.x"
  lambda_iam_role_arn  = aws_iam_role.janitor_role.arn
  lambda_iam_role_name = aws_iam_role.janitor_role.name
  environment_variables = {
    "MAPS_BUCKET"    = aws_s3_bucket.maps_bucket.bucket
    "MAPS_TABLE"     = aws_dynamodb_table.map_table.name
    "CHANNELS_TABLE" = aws_dynamodb_table.channel_table.name
    "DISCORD_TOKEN"  = var.discord_token
  }
}
