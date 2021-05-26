provider "google" {
  project = "carto-bot"
  region  = "us-central1"
}

provider "git" {}

terraform {
  required_providers {
    git = {
      source = "paultyng/git"
      version = "0.1.0"
    }
  }

  backend "gcs" {
    bucket = "carto-bot-tfstate"
    prefix = "carto-bot"
  }
}