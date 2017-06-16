# How to install Cozy

!!! warning ""
    ⚠️ This is a work in progress. For now, there’s no easy and officially supported way to install Cozy. You have to install it and all this dependencies by hand. This tutorial is intended for tech savvy people wanting to give Cozy a first try without waiting for the official documentation and images.

This manual was tested against Arch linux, but you should be able to reproduce it with very minor modifications on your operating system of choice.

## Pre-requisites

Cozy requires a CouchDB 2 database server and a reverse proxy.
We’ll use Nginx in this tutorial but feel free to use your reverse proxy of choice.

## Install dependencies

Here are the packages that may be useful to install and manage your server:

```shell
# If need to, make sure system is up to date
pacman-key --populate archlinux;
pacman-key --refresh-keys;
pacman -Suy;
# Make sure you have the following on your system
sudo pacman -S base-devel \
               sudo \
               ca-certificates \
               curl \
# Install dependencies
sudo pacman -S nginx \
               couchdb \
```

### CouchDB

The Arch package for CouchDB is already up to date for version 2, so there is no need to compile it from source.

Start the database
```shell
sudo systemctl start couchdb
sudo systemctl enable couchdb # enable the couchdb service at startup, if need to
```

Then, let’s create de default databases:
```shell
curl -X PUT http://127.0.0.1:5984/_users
curl -X PUT http://127.0.0.1:5984/_replicator
curl -X PUT http://127.0.0.1:5984/_global_changes
```

!!! warning ""
    ⚠️ The default CouchDB installation has no admin user. Everybody can query the server. So, in production environment, make sure to create en admin user and update the CouchDB connexion URL inside the configuration file of Cozy.

### Install the Cozy Stack

The Cozy server is just a single binary. You can fetch one of its releases from Github:

```shell
# Download the binary
curl -o /usr/local/bin/cozy-stack -L https://github.com/cozy/cozy-stack/releases/download/2017M1-alpha/cozy-stack-linux-amd64-2017M1-alpha
chmod +x /usr/local/bin/cozy-stack

# Create the cozy user/group and folders for log and various files
sudo useradd --system \
        --no-create-home \
        --shell /bin/bash \
        cozy
sudo mkdir /var/{log,lib}/cozy
sudo chown -R cozy: /var/{log,lib}/cozy
```

You can configure your server using a JSON or YAML file. Let’s fetch the sample configuration file:
```shell
sudo mkdir /etc/cozy
sudo curl -o /etc/cozy/cozy.yaml https://raw.githubusercontent.com/cozy/cozy-stack/master/cozy.example.yaml
chown -R cozy: /etc/cozy
```

You can edit this file to adapt it to your configuration.
You should complete the directory to store the files, that you setup earlier.
For example:
```yaml
  fs:
    url: file://localhost/var/lib/cozy
```
If you decide to create another folder don’t forget to allow the cozy user to write inside this folder.

## Configuration

### NGinx

Let’s assume you want to host a server on `mycozy.tld` with a self-signed certificate, the next steps show you how to configure Nginx as a reverse-proxy in front of Cozy.

```shell
# Initialize variables with default values for configuration
instance_domain="mycozy.tld";
```

#### Certificate

Generate the certificate. We need a wild-card certificate, as every application inside Cozy will have it’s own sub-domain:

```shell
sudo openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout /etc/cozy/${instance_domain}.key \
    -out /etc/cozy/${instance_domain}.crt \
    -days 365 -subj "/CN={*.${instance_domain}}"
```

#### Configuration

Then create a virtual host for your server by creating a file at `/etc/cozy/sites-available/${instance_domain}.conf` with the following configuration template.
In this template, you can replace:
- %PORT% with the public port nginx will listen to (default should be 443).
- %SERVER_PORT% with the private port cozy will listen to (default should be 8080).
- %DOMAIN% with the ${instance_domain} you initialized earlier

```shell
sudo mkdir -p /etc/cozy/sites-available/
# Paste the following config in the .config file
sudo nano /etc/cozy/sites-available/${instance_domain}.conf
# Replace placeholders with actual values
sudo sed "s/%PORT%/1443/g; s/%SERVER_PORT%/8080/g; s/%DOMAIN%/${instance_domain}/g" "/etc/nginx/sites-available/${instance_domain}.conf" > "/etc/nginx/sites-available/${instance_domain}.conf"
```

```nginx
server {
    listen %PORT%;

    server_name *.%DOMAIN%;

    ssl_certificate /etc/cozy/%DOMAIN%.crt;
    ssl_certificate_key /etc/cozy/%DOMAIN%.key;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers EECDH+AES;
    ssl_prefer_server_ciphers on;
    ssl on;

    gzip_vary on;
    client_max_body_size 1024M;

    add_header Strict-Transport-Security max-age=31536000;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect http:// https://;
        proxy_pass http://127.0.0.1:%SERVER_PORT%;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    access_log /var/log/nginx/cozy.log;
}
```

Make sure your configuration is included in the main configuration : you should see a line like this before the final closing bracket (don't forget the ending semi-colon):
```
  include /etc/nginx/sites-enabled/*;
```

Here is a minimal `nginx.conf` configuration file, for reference:
```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;
    include site-enabled/*.conf;
}
```

Then, enable the configuration file of your virtual host by creating a symbolic link to let know nginx of this configuration:
```shell
sudo mkdir -p /etc/nginx/sites-enabled
sudo ln -s "/etc/cozy/sites-available/${instance_domain}.conf" /etc/nginx/sites-enabled/
```

Make sure your configuration is valid:
```shell
sudo nginx -t -c /etc/nginx/nginx.conf
```

And start NGinx:
```shell
sudo systemctl start nginx
sudo systemctl enable nginx # enable the nginx service at startup, if need to
```

### Cozy

The Cozy server requires a main password:
```shell
sudo /usr/local/bin/cozy-stack config passwd /etc/cozy/
```

This password will be asked every time you use the `cozy-stack` command line. To prevent this, you can set the `COZY_ADMIN_PASSWORD` environment variable.

### DNS

Add the following records to your DNS (replacing `${instance_domain}` with your domain of choice):
```
${instance_domain}   A     your IP
*.${instance_domain} CNAME ${instance_domain}
```

## Running

For now, we’ll just run the server as a background job, but it is highly recommended to use some supervisor software.

First, start the server:

```shell
sudo -b -u cozy sh -c '/usr/local/bin/cozy-stack serve \
     --log-level debug \
     --host 0.0.0.0 >> /var/log/cozy/cozy.log 2 >> /var/log/cozy/cozy-err.log'
```

Then, create your instance:

```shell
cozy-stack instances add \
           --host 0.0.0.0 \
           --apps files,settings,onboarding \
           --passphrase "XXX" \
           ${instance_domain}
```

!!! warning ""
    ⚠️ The url of your cozy determines the name of your instace.
    If you choose another public port than the default public port for SSL (443), say `9090`, then you should reflect this when creating your cozy instance with the ${instance_domain} as `mycozy.tld:9090`.
    Otherwise, cozy will search for the instance `mycozy.tld:9090` which does not exist, as you created only the instance `mycozy.tld`.

You can add other instances by just running this command again.

## The End

You can now access your cozy instance at `https://${instance_domain}`


## TODO

- Cozy also requires a SMTP server (or relay).
- Let's encrypt certificate to avoid the auto-signed certificate
