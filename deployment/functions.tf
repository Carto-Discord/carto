resource "google_cloudfunctions_function" "carto_api" {
  name    = "${var.app_name}-api"
  runtime = "python39"

  available_memory_mb   = 512
  source_archive_bucket = google_storage_bucket.code_archives.name
  source_archive_object = google_storage_bucket_object.api_archive.name
  trigger_http          = true
  entry_point           = "function"
}

resource "google_cloudfunctions_function" "carto_client" {
  name    = "${var.app_name}-client"
  runtime = "nodejs14"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.code_archives.name
  source_archive_object = google_storage_bucket_object.client_archive.name
  trigger_http          = true
  entry_point           = "slashFunction"

  environment_variables = {
    PUBLIC_KEY        = var.public_key
    HTTP_TRIGGER_URL  = google_cloudfunctions_function.carto_api.https_trigger_url
  }
}

resource "google_cloudfunctions_function" "carto_receiver" {
  name    = "${var.app_name}-receiver"
  runtime = "nodejs14"

  available_memory_mb   = 128
  source_archive_bucket = google_storage_bucket.code_archives.name
  source_archive_object = google_storage_bucket_object.receiver_archive.name
  entry_point           = "receiver"

  event_trigger {
    event_type  = "google.pubsub.topic.publish"
    resource    = google_pubsub_topic.api_complete.id
  }
}

resource "google_pubsub_topic" "api_complete" {
  name = "api-complete"
}