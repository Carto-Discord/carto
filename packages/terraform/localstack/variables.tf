variable "app_name" {
  default = "carto-bot"
}

variable "discord_public_key" {}

variable "discord_token" {}

variable "discord_base_url" {
  default = "http://host.docker.internal:3000"
}

variable "ld_preload" {
  default = "/var/task/lib/libz.so.1"
}