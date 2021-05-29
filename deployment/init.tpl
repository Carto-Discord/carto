#cloud-config
users:
  - name: ${user}
    groups: sudo
    shell: /bin/bash
    sudo: ["ALL=(ALL) NOPASSWD:ALL"]

package_upgrade: true
packages:
  - cron
  - git
  - python3-pip
  - python3-venv

write_files:
  - path: /var/log/carto/gunicorn-access.log
  - path: /var/log/carto/gunicorn-error.log
  - path: /etc/systemd/system/gunicorn.service
    content: |
      [Unit]
      Description=gunicorn daemon
      After=network.target

      [Service]
      User=${user}
      Environment="MAP_BUCKET=${map_bucket}"
      WorkingDirectory=/home/${user}/carto/api
      ExecStart=/home/${user}/carto/api/venv/bin/gunicorn --bind 0.0.0.0:${port} \
          --access-logfile /var/log/carto/gunicorn-access.log --error-logfile /var/log/carto/gunicorn-error.log \
          --log-level DEBUG wsgi:app

      [Install]
      WantedBy=multi-user.target
  - path: /home/${user}/setup.sh
    permissions: 0777
    content: |
      #!/bin/bash

      cd /home/${user}
      git clone https://github.com/Carto-Discord/carto.git
      cd carto/api

      python3 -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
      deactivate
  - path: /home/${user}/sync.sh
    permissions: 0777
    content: |
      #!/bin/bash

      cd /home/${user}/carto/api
      LOCAL=$(git rev-parse @)
      BASE=$(git merge-base @ "@{u}")

      if [ $LOCAL = $BASE]; then
        sudo systemctl stop gunicorn
        git pull --rebase
        source venv/bin/activate
        pip install -r requirements.txt
        sudo systemctl start gunicorn
      fi
  - path: /etc/cron.d/syncjob
    content: |
      */15 * * * * [${user}] /home/${user}/sync.sh
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
  - path: /etc/google-fluentd/config.d/gunicorn-log.conf
    content: |
      <source>
        @type tail
        <parse>
            # 'none' indicates the log is unstructured (text).
            @type none
        </parse>
        # The path of the log file.
        path /var/log/carto/gunicorn-*.log
        # The path of the position file that records where in the log file
        # we have processed already. This is useful when the agent
        # restarts.
        pos_file /var/lib/google-fluentd/pos/gunicorn-error-log.pos
        read_from_head true
        # The log tag for this log input.
        tag carto-api-log
      </source>

runcmd:
  - "curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh"
  - "bash add-logging-agent-repo.sh --also-install"
  - "chown -R ${user}:${user} /var/log/carto"
  - "/home/${user}/setup.sh"
  - "chown -R ${user}:${user} /home/${user}"
  - "sudo systemctl start gunicorn"
  - "sudo systemctl enable gunicorn"
  - "sudo systemctl enable cron"
