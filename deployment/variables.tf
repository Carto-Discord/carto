variable "app_name" {
  default = "carto-bot"
}

variable "discord_public_key" {
  description = "Discord App Public Key"
}

variable "api_trigger_url" {
  description = "API trigger URL"
}

variable "availability_zones" {
  default = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

variable "subnet_cidrs" {
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}