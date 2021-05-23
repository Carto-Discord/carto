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

variable "api_port" {
  default     = 5000
  description = "Port on which to run the API"
}

variable "server_user" {
  default = "carto"
}


