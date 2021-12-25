variable "app_name" {
  description = "Name of the app to be deployed"
}

variable "repository_url" {
  description = "ECR repository where the container image is located"
}

variable "maps_bucket" {
    description = "S3 Bucket to store Maps"
}

variable "availability_zones" {
  default = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}

variable "subnet_cidrs" {
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}