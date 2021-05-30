data "google_container_registry_image" "api_tagged" {
  name = "api"
  tag  = "latest"
}

data "docker_registry_image" "api" {
  name = data.google_container_registry_image.api_tagged.image_url
}

data "google_container_registry_image" "api" {
  name   = "api"
  digest = data.docker_registry_image.api.sha256_digest
}