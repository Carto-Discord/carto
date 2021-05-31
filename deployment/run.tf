resource "google_cloud_run_service" "api" {
  name     = "${var.app_name}-api"
  location = var.function_location

  template {
    spec {
      containers {
        image = data.google_container_registry_image.api.image_url

        ports {
          name           = "http1"
          container_port = 8080
        }

        env {
          name = "MAP_BUCKET"
          value = google_storage_bucket.map_storage.name
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}