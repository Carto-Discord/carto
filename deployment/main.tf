module "ecr" {
    source = "./modules/ecr"

    app_name = var.app_name
}

module "fargate" {
  source = "./modules/fargate"

  app_name  = var.app_name
  repository_url = module.ecr.repository_url
  maps_bucket = aws_s3_bucket.maps_bucket.bucket
}

module "lambda" {
    source = "./modules/lambda"
    app_name  = var.app_name
    discord_public_key = var.discord_public_key
    api_trigger_url = module.fargate.api_trigger_url
}