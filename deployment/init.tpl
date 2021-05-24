#cloud-config
users:
  - name: ${user}
    groups: sudo
    shell: /bin/bash
    sudo: [ "ALL=(ALL) NOPASSWD:ALL" ]

package_upgrade: true
packages:
  - git
  - python3-pip
  - python3-venv

write_files:
  - path: /var/lib/cloud/scripts/per-boot/git-update.sh
    permissions: 0744
    owner: root
    content: |
      #!/bin/bash

      cd /carto
      git pull --rebase
      source venv/bin/activate
      pip install -r requirements.txt
      cd api

      MAP_BUCKET=${map_bucket}
      gunicorn --bind 0.0.0.0:${port} \
      --access-logfile /var/log/carto/gunicorn-access.log --error-logfile /var/log/carto/gunicorn-error.log \
      --log-level DEBUG wsgi:app

  - path: /home/carto/setup.sh
    permissions: 0744
    owner: root
    content: |
      #!/bin/bash

      git clone https://github.com/Carto-Discord/carto.git
      cd carto
      python3 -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
      cd api

      MAP_BUCKET=${map_bucket}
      gunicorn --bind 0.0.0.0:${port} \
        --access-logfile /var/log/carto/gunicorn-access.log --error-logfile /var/log/carto/gunicorn-error.log \
        --log-level DEBUG wsgi:app

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
  - "/home/carto/setup.sh"
