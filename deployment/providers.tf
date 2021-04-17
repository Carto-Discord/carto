provider "google" {
  project = "carto-discord"
  region  = "us-central1"
}

terraform {
  backend "gcs" {
    bucket = "carto-discord-tfstate"
    prefix = "carto-discord"
  }
}