#cloud-config
users:
  - name: ${user}
    groups: sudo
    shell: /bin/bash
    sudo: [ "ALL=(ALL) NOPASSWD:ALL" ]

package_upgrade: true
packages:
  - gunicorn
  - git
  - python3-pip
  - python3-venv

write_files:
  - path: /etc/environment
    content: |
      MAP_BUCKET="${map_bucket}"
    append: true
  - path: /var/lib/cloud/scripts/per-boot/git-update.sh
    content: |
      #/bin/bash

      cd /carto/api
      git pull --rebase
      source venv/bin/activate
      pip install -r requirements.txt
      gunicorn --bind "0.0.0.0:${port}" \
        --access-logfile /var/log/carto/gunicorn-access.log --error-logfile /var/log/carto/gunicorn-error.log \
        --log-level DEBUG "wsgi:app"

  - path: /etc/logrotate.d/carto
    content: |
      /var/log/carto/*.log {
        weekly
        compress
        notifempty
        dateext
        dateformat -%Y-%m-%d
        create 0640 ${user} ${user}
        dateyesterday
        rotate 12
      }
  - path: /var/log/carto/gunicorn-access.log
  - path: /var/log/carto/gunicorn-error.log

runcmd:
  - [ git, clone, "https://github.com/Carto-Discord/carto.git" ]
  - [ cd, carto ]
  - [ python3, -m, venv, venv ]
  - [ source, venv/bin/activate ]
  - [ cd, api ]
  - [ pip, install, -r, requirements.txt ]
  - [
      gunicorn,
      --bind,
      "0.0.0.0:${port}",
      --access-logfile,
      /var/log/carto/gunicorn-access.log,
      --error-logfile,
      /var/log/carto/gunicorn-error.log,
      --log-level,
      DEBUG,
      "wsgi:app",
  ]
