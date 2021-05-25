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
      --access-logfile /var/log/${user}/gunicorn-access.log --error-logfile /var/log/${user}/gunicorn-error.log \
      --log-level DEBUG wsgi:app

  - path: /home/${user}/setup.sh
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
        --access-logfile /var/log/${user}/gunicorn-access.log --error-logfile /var/log/${user}/gunicorn-error.log \
        --log-level DEBUG wsgi:app

  - path: /etc/logrotate.d/${user}
    content: |
      /var/log/${user}/*.log {
        weekly
        compress
        notifempty
        dateext
        dateformat -%Y-%m-%d
        create 0640 ${user} ${user}
        dateyesterday
        rotate 12
      }
  - path: /var/log/${user}/gunicorn-access.log
  - path: /var/log/${user}/gunicorn-error.log

  - path: /etc/google-fluentd/config.d/gunicorn-log.conf
    content: |
      <source>
        @type tail
        <parse>
            # 'none' indicates the log is unstructured (text).
            @type none
        </parse>
        # The path of the log file.
        path /var/log/${user}/gunicorn-*.log
        # The path of the position file that records where in the log file
        # we have processed already. This is useful when the agent
        # restarts.
        pos_file /var/lib/google-fluentd/pos/gunicorn-error-log.pos
        read_from_head true
        # The log tag for this log input.
        tag ${user}-api-log
      </source>

runcmd:
  - "curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh"
  - "bash add-logging-agent-repo.sh --also-install"
  - "/home/carto/setup.sh"
