data "google_app_engine_default_service_account" "default" {}

resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.carto_api.project
  region         = google_cloudfunctions_function.carto_api.region
  cloud_function = google_cloudfunctions_function.carto_api.name

  role   = "roles/cloudfunctions.invoker"
  member = "serviceAccount:${data.google_app_engine_default_service_account.default.email}"
}