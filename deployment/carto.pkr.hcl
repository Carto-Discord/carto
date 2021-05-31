packer {
  required_plugins {
    docker = {
      version = ">= 0.0.7"
      source  = "github.com/hashicorp/docker"
    }
  }
}

variable "workdir" {
  default     = "/api"
  description = "Working directory within the container"
}

variable "port" {
  default     = 8080
  description = "Port on which to run the gunicorn server"
}

variable "project-id" {
  default     = "carto-bot"
  description = "GCP Project for tagging purposes"
}

source "docker" "python" {
  image  = "python:3.9-slim"
  commit = true
  changes = [
    "ENV PYTHONUNBUFFERED True",
    "WORKDIR ${var.workdir}",
    "CMD [\"run.sh\"]"
  ]
}

build {
  sources = [
    "source.docker.python",
  ]

  provisioner "file" {
    source      = "api/"
    destination = var.workdir
  }

  provisioner "shell" {
    inline = [
      "cd ${var.workdir}",
      "python -m venv venv",
      "venv/bin/pip install --upgrade pip",
      "venv/bin/pip install -r requirements.txt",
    ]
  }

  provisioner "shell" {
    inline = [
      "echo \"venv/bin/gunicorn --bind :${var.port} --workers 1 --threads 8 --timeout 0 wsgi:app\" > ${var.workdir}/run.sh"
    ]
  }

  post-processor "docker-tag" {
    repository = "gcr.io/${var.project-id}/api"
    tags       = ["latest"]
  }

}
