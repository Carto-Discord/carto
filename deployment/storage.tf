data "archive_file" "application_zip" {
  type        = "zip"
  source_dir  = "../api_package/"
  output_path = "../api.zip"
}

data "archive_file" "client_zip" {
  type = "zip"
  source_dir = "../client/package/"
  output_path = "../client.zip"
}

data "archive_file" "receiver_zip" {
  type = "zip"
  source_dir = "../receiver/package/"
  output_path = "../receiver.zip"
}

resource "google_storage_bucket" "map_storage" {
  name                        = "${var.app_name}-map-uploads"
  location                    = var.location
  force_destroy               = true
  uniform_bucket_level_access = true

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30
    }
  }
}

resource "google_storage_bucket" "code_archives" {
  name          = "${var.app_name}-code"
  location      = var.location
  force_destroy = true
}

resource "google_storage_bucket_object" "api_archive" {
  name    = "${var.app_name}_api.${data.archive_file.application_zip.output_md5}.zip"
  bucket  = google_storage_bucket.code_archives.name
  source  = data.archive_file.application_zip.output_path
}

resource "google_storage_bucket_object" "client_archive" {
  name    = "${var.app_name}_client.${data.archive_file.client_zip.output_md5}.zip"
  bucket  = google_storage_bucket.code_archives.name
  source  = data.archive_file.client_zip.output_path
}

resource "google_storage_bucket_object" "receiver_archive" {
  name    = "${var.app_name}_receiver.${data.archive_file.receiver_zip.output_md5}.zip"
  bucket  = google_storage_bucket.code_archives.name
  source  = data.archive_file.receiver_zip.output_path
}