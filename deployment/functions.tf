resource "google_cloudfunctions_function" "carto_client" {
  name    = "${var.app_name}-client"
  runtime = "nodejs14"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.code_archives.name
  source_archive_object = google_storage_bucket_object.client_archive.name
  trigger_http          = true
  entry_point           = "slashFunction"

  environment_variables = {
    PUBLIC_KEY          = var.discord_public_key
    API_TRIGGER_URL     = google_cloud_run_service.api.status.0.url
    MAP_BUCKET          = google_storage_bucket.map_storage.name
  }
}