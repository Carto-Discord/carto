variable "app_name" {
  default = "carto-bot"
}

variable "discord_base_url" {
  default = "https://discord.com/api/v9"
}

variable "ld_preload" {
  default = "/var/task/lib/libz.so.1"
}

variable "discord_public_key" {}

variable "discord_token" {}

variable "contact_email" {
  type = string
}
