resource "google_app_engine_standard_app_version" "app" {
  version_id = "v1"
  service    = "default"
  runtime    = "nodejs14"

  deployment {
    zip {
      source_url = "https://storage.googleapis.com/${google_storage_bucket.code_archives.name}/${google_storage_bucket_object.client_archive.name}"
    }
  }

  env_variables = {
    "BOT_TOKEN"         = var.bot_token
    "HTTP_TRIGGER_URL"  = google_cloudfunctions_function.carto_api.https_trigger_url
  }

  handlers {
    url_regex = "/"
    script {
      script_path = "auto"
    }
  }

  automatic_scaling {
    min_idle_instances = 1
    max_idle_instances = 1
    standard_scheduler_settings {
      min_instances = 1
      max_instances = 5
    }
  }

  delete_service_on_destroy = true
}

resource "google_cloud_scheduler_job" "job" {
  name             = "keep-alive-job"
  description      = "keeps the app engine alive"
  schedule         = "*/15 * * * *"
  time_zone        = "Europe/London"
  attempt_deadline = "320s"

  retry_config {
    retry_count = 1
  }

  app_engine_http_target {
    http_method  = "GET"
    relative_uri = "/"
  }
}