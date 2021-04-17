resource "google_storage_bucket" "map_storage" {
  name          = "${var.app_name}-map-uploads"
  location      = var.location
  force_destroy = true
}

resource "google_storage_bucket" "functions_code" {
  name          = "${var.app_name}-functions-code"
  location      = var.location
  force_destroy = true
}

data "archive_file" "application_zip" {
  type = "zip"
  source_dir = "../api/"
  output_path = "../api.zip"
}

resource "google_storage_bucket_object" "function_archive" {
  name    = "${var.app_name}_api.${data.archive_file.application_zip.output_md5}.zip"
  bucket  = google_storage_bucket.functions_code.name
  source  = data.archive_file.application_zip.output_path
}