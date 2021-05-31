variable "app_name" {
  default = "carto-bot"
}

variable "location" {
  default     = "US"
  description = "Location of Storage Buckets"
}

variable "function_location" {
  default = "us-central1"
}

variable "discord_public_key" {
  description = "Discord App Public Key"
}

variable "container_repo" {
  description = "Name of the container repository to load"
}

variable "container_tag" {
  description = "Version of the container to deploy"
}


