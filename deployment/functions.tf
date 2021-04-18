resource "google_cloudfunctions_function" "carto_api" {
  name    = "${var.app_name}-api"
  runtime = "python39"

  available_memory_mb   = 512
  source_archive_bucket = google_storage_bucket.code_archives.name
  source_archive_object = google_storage_bucket_object.api_archive.name
  trigger_http          = true
  entry_point           = "function"
}