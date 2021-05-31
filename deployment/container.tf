data "google_container_registry_image" "api_tagged" {
  name = var.container_repo
  tag  = var.container_tag
}

data "docker_registry_image" "api" {
  name = data.google_container_registry_image.api_tagged.image_url
}

data "google_container_registry_image" "api" {
  name   = var.container_repo
  digest = data.docker_registry_image.api.sha256_digest
}