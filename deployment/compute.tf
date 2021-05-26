resource "google_compute_firewall" "firewall" {
  name    = "${var.app_name}-firewall-externalssh"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["externalssh"]
}

resource "google_compute_firewall" "webserverrule" {
  name    = "${var.app_name}-webserver"
  network = "default"
  allow {
    protocol = "tcp"
    ports    = ["80", "443", var.api_port]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["webserver"]
}

data "google_compute_default_service_account" "default" {}

data "template_cloudinit_config" "config" {
  gzip          = false
  base64_encode = false

  # Main cloud-config configuration file.
  part {
    filename     = "init.cfg"
    content_type = "text/cloud-config"
    content = templatefile("${path.module}/init.tpl", {
      user             = var.server_user
      port             = var.api_port
      map_bucket       = google_storage_bucket.map_storage.name
    })
  }
}

resource "google_compute_instance" "server" {
  name                      = "${var.app_name}-server"
  hostname                  = "${var.app_name}.api"
  machine_type              = "f1-micro"
  zone                      = "us-central1-a"
  tags                      = ["externalssh", "webserver"]
  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-minimal-2004-lts"
    }
  }

  network_interface {
    network = "default"

    access_config {}
  }

  metadata = {
    user-data = data.template_cloudinit_config.config.rendered
    # Adding something that changes when the code changes to keep the server rebooting
    # When updates are pushed. This will keep the internal git repo up to date too
    source-hash = data.archive_file.api_zip.output_md5
  }

  service_account {
    email  = data.google_compute_default_service_account.default.email
    scopes = ["cloud-platform"]
  }

  # Ensure firewall rule is provisioned before server, so that SSH doesn't fail.
  depends_on = [
    google_compute_firewall.firewall,
    google_compute_firewall.webserverrule
  ]
}
