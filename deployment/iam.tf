resource "google_cloudfunctions_function_iam_member" "client_invoker" {
  project        = google_cloudfunctions_function.carto_client.project
  region         = google_cloudfunctions_function.carto_client.region
  cloud_function = google_cloudfunctions_function.carto_client.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "public_rule" {
  bucket = google_storage_bucket.map_storage.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}