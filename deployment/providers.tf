provider "google" {
  project = "carto-bot"
  region  = "us-central1"
}

data "google_client_config" "default" {}

provider "docker" {
  registry_auth {
    address  = "gcr.io"
    username = "oauth2accesstoken"
    password = data.google_client_config.default.access_token
  }
}

terraform {
  backend "gcs" {
    bucket = "carto-bot-tfstate"
    prefix = "carto-bot"
  }

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = ">= 2.0"
    }
  }
}