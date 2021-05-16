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

variable "public_key" {
  description = "Discord App Public Key"
}
