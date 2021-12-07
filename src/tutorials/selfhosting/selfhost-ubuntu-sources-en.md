# Install cozy on Ubuntu 20.04 LTS focal fossa

# Introduction

Cozycloud provides Debian packages and [installation instructions](https://docs.cozy.io/en/tutorials/selfhosting/selfhost-debian-pkg/) for Debian 10 buster from installation packages. However, there is no published packages for Ubuntu.

This documentation describes how to install cozy from sources on an Ubuntu 20.04 LTS focal fossa server. We will also see how to host multiple cozy instances on the same server, how to activate online edition for office documents and how to upgrade cozy-stack.


# Requirements

The installation procedure requires:

- An Ubuntu 20.04 LTS focal fossa server
- A domain name (mandatory to host cozy instances secured with https and accessible from internet).
    In this docuemnt, we will use `domain.example` as an example. You will replace it with your own domain name throughout the explanation.
    The address of your cozy instance will be `cozy.domain.example`
- Good system administration knowledge. Despite documentation's goal is to be pretty straightforward to follow, there are some tricky and technical parts.

During installation, you will also define:

- a CouchDB admininstration password
- a CouchDB database access password
- a cozy-stack admin password
- You will need to provide your email address for Let's Encrypt SSL certificate validation and your cozy instance creation

# Couchdb

Configure CouchDB package repository:

    sudo apt update && sudo apt install -y curl apt-transport-https gnupg
    curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
    echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null

Install Couchdb:

    sudo apt update
    sudo apt install -y couchdb

Duing CouchDB installation, choose `Standalone` mode and define admin password.

Validate CouchDB is working:

    curl http://localhost:5984/
    {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

Finally, create a database user and password for  cozy-stack:

    read -p "Couchdb password for cozy user: " -r -s COUCH_PASS
    curl -fsX PUT -u "admin:adminpwd" "http://localhost:5984/_node/couchdb@127.0.0.1/_config/admins/cozy" --data "\"${COUCH_PASS}\""

In this command line, `adminpwd` should be replaced by CouchDB admin password you defined during CouchDB installation.

# NodeJS

To be able to run cozy connectors and gather all your data, cozy-stack needs NodeJS version 12 or 16. This documents gives instructions to instal NodeJS 16.

Configure NodeJS 16 package repository:

    KEYRING=/usr/share/keyrings/nodesource.gpg
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
    echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    echo "deb-src [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list >/dev/null

Install NodeJS:

    sudo apt update
    sudo apt install -y nodejs
    sudo ln -s /usr/bin/node /usr/bin/nodejs

# Go

cozy-stack is developped in Go language so we need to install the go compiler to be able to compile cozy-stack sources:

    wget -O /tmp/go1.17.3.linux-amd64.tar.gz https://go.dev/dl/go1.17.3.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzvf /tmp/go1.17.3.linux-amd64.tar.gz
    echo "export PATH=\"\$PATH:/usr/local/go/bin\"" | sudo tee /etc/profile.d/golang.sh > /dev/null
    source /etc/profile.d/golang.sh

Test Go installation is fine with:

    go version
    go version go1.17.3 linux/amd64

# Cozy-stack

First, install requirements:

    sudo apt install -y imagemagick libprotobuf-c1 fonts-lato

Get the source code:

    sudo apt install -y git
    sudo git clone https://github.com/cozy/cozy-stack.git /opt/cozy-stack

Then compile the program:

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

The compilation generate a binary file under `$GOPATH/bin/cozy-stack`

You can test it with:

    $(go env GOPATH)/bin/cozy-stack version
    1.5.0-5-gcbdf012d

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
                 /opt/cozy-stack/scripts/konnector-node16-run.sh \
                 /usr/share/cozy/konnector-node16-run.sh
    sudo install -o cozy-stack -g cozy -m 750 -d /var/lib/cozy


And create configuration:

    read -p "Cozy stack admin password: " -r -s COZY_PASS
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
      cmd: /usr/share/cozy/konnector-node16-run.sh

    log:
      level: info
      syslog: true

    registries:
      default:
      - https://apps-registry.cozycloud.cc/selfhosted
      - https://apps-registry.cozycloud.cc/banks
      - https://apps-registry.cozycloud.cc/
    EOF
    sudo chown cozy-stack:cozy /etc/cozy/cozy.yml
    sudo chmod 0644 /etc/cozy/cozy.yml
    sudo sh -c "COZY_ADMIN_PASSWORD=\"${COZY_PASS}\" cozy-stack config passwd /etc/cozy/cozy-admin-passphrase"
    sudo chown cozy-stack:cozy /etc/cozy/cozy-admin-passphrase
    sudo cozy-stack config gen-keys /etc/cozy/vault
    sudo chown cozy-stack:cozy /etc/cozy/vault.enc /etc/cozy/vault.dec
    sudo chmod 0600 /etc/cozy/vault.enc /etc/cozy/vault.dec

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
    {"build_mode":"production","build_time":"2021-12-01T13:12:36Z","runtime_version":"go1.17.3","version":"1.5.0-5-gcbdf012d"}

# Nginx

First create a DNS entry in your domain for `cozy.domain.example` and `*.cozy.domain.example` pointing at your server. For example:


    cozy     1h     IN         A     <your_server_IP>
    *.cozy   1h     IN     CNAME     cozy

Then install Nginx:

    sudo apt install -y nginx certbot

Generate SSL certificate with certbot:

    DOMAIN=domain.example
    EMAIL="<your email address>"
    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d cozy.${DOMAIN} $(printf -- " -d %s.cozy.${DOMAIN}" home banks contacts drive notes passwords photos settings store)

Create nginx reload script for your certificate to be reloaded each time it is automatically refreshed, every 3 months:

    cat <<EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
    #!/bin/bash
    nginx -t -q && nginx -s reload
    EOF
    chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

Configure nginx:

    DOMAIN=domain.example
    cat <<EOF | sudo tee /etc/nginx/sites-available/cozy.${DOMAIN} > /dev/null
    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.cozy.${DOMAIN} cozy.${DOMAIN};

        location /.well-known {
            alias /var/www/html/.well-known;
        }

        location / {
            return         301 https://\$host\$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/letsencrypt/live/cozy.${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/cozy.${DOMAIN}/privkey.pem;

        server_name *.cozy.${DOMAIN} cozy.${DOMAIN};
        access_log /var/log/nginx/cozy.${DOMAIN}.access.log;
        error_log /var/log/nginx/cozy.${DOMAIN}.error.log;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;";
        client_max_body_size 1g;

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Forwarded-For \$remote_addr;
        }
    }
    EOF
    sudo ln -s ../sites-available/cozy.${DOMAIN} /etc/nginx/sites-enabled/
    sudo systemctl reload nginx

You can then test from your browser by visiting `https://cozy.domain.example` and you should see a page telling you this cozy instance doesn't exist yet. This is the sign that everything went well and the only part left is to create the instance.

# Cozy instance creation

Create your cozy instance:

    DOMAIN=domain.example
    EMAIL=<your email address>
    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${EMAIL}" --locale fr --tz "Europe/Paris" cozy.${DOMAIN}

You can of course adapt your language (`locale`) and choose english (`en`) or spanish (`es`) and choose another timezone (`tz`).

Note the “Registration token” this command returns and visit from your browser `https://cozy.domain.example?registerToken=<registration_token>` substituting `domain.example` with your real domain name and `<registration_token>` with the “Registration token” you got.
You will be prompted to define your cozy password and you will be able to start using your self-hosted cozy.


# Et voilà !

Your cozy is not fully operational! Its address is `https://cozy.domain.example` (remplace `domain.example` by your own domain name)
You can then start installing connectors from store to automatically gather your data, save your passwords in cozy-pass, store your files in cozy-drive and install cozy-desktop client on your PC to synchronize your cozy content with a local folder.

Below are some bonuses 😉

# Hosting more than one cozy instance on the same server

Having its own selfhosted cozy instance is nice but hosting cozy instances for friends and familly is a must! Here is how to add more cozy instances on the same server.

The first cozy instance we added was `https://cozy.domain.example`. We will create a second cozy instance for Mary with address `https://mary.domain.example` (Replace `domain.example` with your own domain name and `mary` whith what you want to uniquely identify the cozy instance.

So we will need:

- Our domain name. We still use `domain.example` in this documentation
- The new cozy instance's “slug”, which is its unique identifier. We will use `mary` here for example. The address for this new cozy instance will the be in the form `https://<slug>.<domain>`, for example here `https://mary.domain.example`

First, let's put all that important information in variables:

    DOMAIN=domain.example
    EMAIL=<your email addresse>
    NEWSLUG=mary
    NEWEMAIL=<Mary's email address>

Create DNS entries for this cozy isntance. For example:

    mary     1h     IN         A     <your_server_IP>
    *.mary   1h     IN     CNAME     mary

Create Nginx base configuration for this cozy isntance:

    cat <<EOF | sudo tee /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null
    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};

        location /.well-known {
            alias /var/www/html/.well-known;
        }

        location / {
            return         301 https://\$host\$request_uri;
        }
    }
    EOF
    sudo ln -s ../sites-available/${NEWSLUG}.${DOMAIN} /etc/nginx/sites-enabled/
    sudo systemctl reload nginx

Generate SSL certificate using certbot:

    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d ${NEWSLUG}.${DOMAIN} $(printf -- " -d %s.${NEWSLUG}.${DOMAIN}" home banks contacts drive notes passwords photos settings store)

Finalize Nginx configuration:

    cat <<EOF | sudo tee -a /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/privkey.pem;

        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};
        access_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.access.log;
        error_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.error.log;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;";
        client_max_body_size 1g;

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Forwarded-For \$remote_addr;
        }
    }
    EOF
    sudo systemctl reload nginx

Create cozy instance:

    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${NEWEMAIL}" --locale fr --tz "Europe/Paris" ${NEWSLUG}.${DOMAIN}

Note the “Registration token” the last command gives you and send Mary the following url: `https://mary.domain.example?registerToken=<registration_token>`, substituting `domain.example` with your own domain name, `mary` with the slug you chose for this new instance and  `<registration_token>` with the “Registration token” returned by the last command.
By visiting this address with her browser, Mary will be able to define its password and start using  her cozy.

# Online edtion of office documents

Online office document edition functionality based on OnlyOffice is optional. You can use your cozy without activating it. It let you edit your office documents online directly in your browser, however it requires more resources on your server.

To activate this functionality, you need to install OnlyOffice document server and configure cozy-stack to access it. OnlyOffice document server can be isntalled on the same server or on another server at your convenience. This documentation explain how to install it on the same server.


## Onlyoffice

Onlyoffice requires PostgreSQL and RabbitMQ so we will start by installing them.

### Install PostgreSQL and create database


    sudo apt update
    sudo -i -u postgres psql -c "CREATE DATABASE onlyoffice;"
    sudo -i -u postgres psql -c "CREATE USER onlyoffice WITH password 'onlyoffice';"
    sudo -i -u postgres psql -c "GRANT ALL privileges ON DATABASE onlyoffice TO onlyoffice;

The second command create a database user names `onlyoffice` with password `onlyoffice`. We advise you to choose a more secure password in real life.


### Install RabbitMQ

    sudo apt install -y rabbitmq-server

### Install Onlyoffice Documentserver

Configure package repository

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys CB2DE8E5
    echo "deb https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list
    sudo apt update

Install microsoft fonts

    sudo apt install -y ttf-mscorefonts-installer

When asked, accept EULA

Install OnlyOffice Documentserver

    sudo apt install -y onlyoffice-documentserver

When asked, enter database password we created when installing postgreSQL and created database.

Then restart Nginx

    sudo systemctl reload nginx

### Configure HTTPS for OnlyOffice

Create a DNS entry for OnlyOffice targetting your server. For example:

    onlyoffice     1h     IN         A     <your_server_IP>

Generate SSL certificate:

    EMAIL=<your email address>
    DOMAIN=domain.example
    sudo bash /usr/bin/documentserver-letsencrypt.sh "${EMAIL}" "onlyoffice.${DOMAIN}"

Configure onlyoffice:

    sudo cp -f /etc/onlyoffice/documentserver/nginx/ds-ssl.conf.tmpl /etc/onlyoffice/documentserver/nginx/ds.conf

Edit file `/etc/onlyoffice/documentserver/nginx/ds.conf` and

- replace `{{SSL_CERTIFICATE_PATH}}` with `/etc/letsencrypt/live/onlyoffice.domain.example/fullchain.pem`
- replace `{{SSL_KEY_PATH}}` with `/etc/letsencrypt/live/onlyoffice.domain.example/privkey.pem`

Be careful each line end with semicolons (`;`).

Restart OnlyOffice and Nginx:

    sudo supervisorctl restart all
    sudo systemctl restart nginx


You can now test onlyoffice is accessible from your browser at `https://onlyoffice.domain.example`.

## Configure cozy-stack for OnlyOffice

Update configuration file:

    DOMAIN=domain.example
    cat <<EOF | sudo tee -a /etc/cozy/cozy.yml > /dev/null
    office:
      default:
        onlyoffice_url: https://onlyoffice.${DOMAIN}/
    EOF

Restart cozy-stack:

    sudo systemctl restart cozy-stack

Activate functionality:

    cozy-stack features defaults '{"drive.onlyoffice.enabled": true}'

You can now upload an office document in cozy-drive and start editing it online by clicking on it or start a new empty document for the "New document" menu.


# Update cozy-stack

Applications inside your cozy are automatically updated, however, cozy-stack application running on your server must be updated from time to time (once every 3 month is a good compromise between too much and too few).
Here is how to upgrade cozy-stack:

Update source code:

    cd /opt/cozy-stack
    sudo git pull

compile source code:

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

You can test compilation produced a valid binary with:

    $(go env GOPATH)/bin/cozy-stack version
    1.5.0-9-g1eac6802

Install new generated binary:

    sudo install -o root -g root -m 0755 -T \
                 $(go env GOPATH)/bin/cozy-stack /usr/bin/cozy-stack             

Restart cozy-stack:

    sudo systemctl restart cozy-stack

Et voilà, you just upgraded cozy-stack to the latest verson. pretty easy.

# References
- CouchDB installation: [https://docs.couchdb.org/en/stable/install/unix.html](https://docs.couchdb.org/en/stable/install/unix.html)
- Go installation: [https://go.dev/doc/install](https://go.dev/doc/install)
- NodeJS installation: [https://github.com/nodesource/distributions/blob/master/README.md#manual-installation](https://github.com/nodesource/distributions/blob/master/README.md#manual-installation)
- Cozy-stack installation: [https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md)
- Cozy-stack Configuration Guide: [https://github.com/cozy/cozy-stack/blob/master/docs/config.md](https://github.com/cozy/cozy-stack/blob/master/docs/config.md)
- OnlyOffice installation: [https://helpcenter.onlyoffice.com/installation/docs-community-install-ubuntu.aspx](https://helpcenter.onlyoffice.com/installation/docs-community-install-ubuntu.aspx)
- Configuration https OnlyOffice: [https://helpcenter.onlyoffice.com/installation/docs-community-https-linux.aspx](https://helpcenter.onlyoffice.com/installation/docs-community-https-linux.aspx)
- Cozy-stack office documentation: [https://docs.cozy.io/en/cozy-stack/office/](https://docs.cozy.io/en/cozy-stack/office/)
