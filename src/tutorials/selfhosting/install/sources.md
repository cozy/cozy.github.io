# Installing cozy-stack from sources

## Go

cozy-stack is developped in Go language so we need to install the Go compiler to be able to compile cozy-stack sources:

    wget -O /tmp/go1.21.3.linux-amd64.tar.gz https://go.dev/dl/go1.21.3.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzvf /tmp/go1.21.3.linux-amd64.tar.gz
    echo "export PATH=\"\$PATH:/usr/local/go/bin\"" | sudo tee /etc/profile.d/golang.sh > /dev/null
    source /etc/profile.d/golang.sh

Test Go installation is fine with:

    go version

This command should respond with something like

    go version go1.21.3 linux/amd64

## Cozy-stack

First, add a CouchDB user and password for cozy-stack (replace COUCH_ADMIN_PWD with your previously defined CouchdDB admin password)

    read -p "Couchdb password for cozy user: " -r -s COUCH_PASS
    curl -X PUT -u "admin:COUCH_ADMIN_PWD" "http://localhost:5984/_node/couchdb@127.0.0.1/_config/admins/cozy" --data "\"${COUCH_PASS}\""

Install requirements:

    sudo apt install -y imagemagick ghostscript librsvg2-bin libprotobuf-c1 fonts-lato

Activate PDF thumbnail generation in ImageMagick

    sudo sed -ie 's,^  \(<policy domain="coder" rights="none" pattern="PDF" />\)$,  <!-- \1 -->,g' /etc/ImageMagick-6/policy.xml

Get the source code:

    sudo apt install -y git
    sudo mkdir -p /opt/cozy-stack
    sudo chown ${USER}: /opt/cozy-stack
    git -C /opt/cozy-stack init
    git -C /opt/cozy-stack remote add origin https://github.com/cozy/cozy-stack.git
    git -C /opt/cozy-stack fetch
    git -C /opt/cozy-stack pull origin master

Then compile the program:

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

The compilation generate a binary file under `$GOPATH/bin/cozy-stack`

You can test it with:

    $(go env GOPATH)/bin/cozy-stack version

> This command should respond with the compiled cozy-stack version, like
>
> ```
>     1.6.14-36-ge4577c7ff
> ```

You then have to create a user to run cozy-stack:

    sudo addgroup --quiet --system cozy
    sudo adduser --quiet --system --home /var/lib/cozy \
                 --no-create-home --shell /usr/sbin/nologin \
                 --ingroup cozy cozy-stack

And install it:

    sudo install -o root -g root -m 0755 -T \
                 $(go env GOPATH)/bin/cozy-stack /usr/bin/cozy-stack
    sudo sh -c 'cozy-stack completion bash > /etc/bash_completion.d/cozy-stack'
    source /etc/bash_completion.d/cozy-stack
    sudo install -o root -g root -m 0755 -d /etc/cozy
    sudo install -o root -g cozy -m 0750 -d /var/log/cozy
    sudo install -o cozy-stack -g cozy -m 750 -d /usr/share/cozy
    sudo install -o cozy-stack -g cozy -m 750 \
                 /opt/cozy-stack/scripts/konnector-node-run.sh \
                 /usr/share/cozy/konnector-node-run.sh
    sudo install -o cozy-stack -g cozy -m 750 -d /var/lib/cozy

And create configuration:

    read -p "Cozy stack admin password: " -r -s COZY_PASS
    sudo sh -c "COZY_ADMIN_PASSPHRASE=\"${COZY_PASS}\" cozy-stack config passwd /etc/cozy/cozy-admin-passphrase"
    sudo chown cozy-stack:cozy /etc/cozy/cozy-admin-passphrase
    sudo cozy-stack config gen-keys /etc/cozy/vault
    sudo chown cozy-stack:cozy /etc/cozy/vault.enc /etc/cozy/vault.dec
    sudo chmod 0600 /etc/cozy/vault.enc /etc/cozy/vault.dec
    cat <<EOF | sudo tee /etc/cozy/cozy.yml >/dev/null
    host: 127.0.0.1
    port: 8080

    admin:
      host: 127.0.0.1
      port: 6060

    couchdb:
      url: http://cozy:${COUCH_PASS}@127.0.0.1:5984/

    fs:
      url: file:///var/lib/cozy

    vault:
      credentials_encryptor_key: /etc/cozy/vault.enc
      credentials_decryptor_key: /etc/cozy/vault.dec

    konnectors:
      cmd: /usr/share/cozy/konnector-node-run.sh

    log:
      level: info
      syslog: true

    registries:
      default:
      - https://apps-registry.cozycloud.cc/selfhosted
      - https://apps-registry.cozycloud.cc/mespapiers
      - https://apps-registry.cozycloud.cc/banks
      - https://apps-registry.cozycloud.cc/
    EOF
    sudo chown cozy-stack:cozy /etc/cozy/cozy.yml
    sudo chmod 0640 /etc/cozy/cozy.yml

Finally, configure systemd to automatically launch cozy-stack on boot:

    cat <<EOF | sudo tee /usr/lib/systemd/system/cozy-stack.service >/dev/null
    [Unit]
    Description=Cozy service
    Wants=couchdb.service
    After=network.target couchdb.service

    [Service]
    User=cozy-stack
    Group=cozy
    WorkingDirectory=/var/lib/cozy/
    PermissionsStartOnly=true
    ExecStart=/usr/bin/cozy-stack serve
    Restart=always

    [Install]
    WantedBy=multi-user.target
    EOF
    sudo systemctl daemon-reload
    sudo systemctl enable cozy-stack
    sudo systemctl start cozy-stack

You can validate everything went well and cozy-stack is running thiw way:

    curl http://localhost:8080/version

> This command should give you cozy-stack installed version. For example:
>
> ```
> {"build_mode":"production","build_time":"2023-11-15T15:57:06Z","runtime_version":"go1.21.3","version":"1.6.14-36-ge4577c7ff"}
> ```

<div style="text-align: right">
  <a href="../../finalize/nginx/">Next --&gt;</a>
</div>
