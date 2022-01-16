provider "aws" {
  region = "eu-central-1"
  profile = "terraform"
}

terraform {
  backend "s3" {
    bucket = "carto-bot-tf-state"
    key    = "terraform.tfstate"
    region = "eu-central-1"
  }
}
