variable "app_name" {
  default = "carto-bot"
}

variable "discord_base_url" {
  default = "https://discord.com/api/v9"
}

variable "discord_public_key" {}

variable "ld_preload" {
  default = "/var/task/lib/libz.so.1"
}
