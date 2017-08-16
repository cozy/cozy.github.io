# How to install Cozy on Debian Stable

!!! warning ""
    ⚠️ This is a work in progress. For now, there’s no easy and officially supported way to install Cozy. You have to install it and all this dependencies by hand. This tutorial is intended for tech savvy people wanting to give Cozy a first try without waiting for the official documentation and images.

!!! warning ""
    For now, this documentation don’t explain how to install the technology stack required for connector, as the technology we use may evolve. So you won’t be able to run the connectors.

!!! info ""
    Most of the following commands require root privileges. You can either open a root shell or use `sudo` when needed;

## Pre-requisites

Cozy requires a CouchDB 2 database server, a reverse proxy and an SMTP server. We’ll use Nginx in this tutorial but feel free to use your reverse proxy of choice.

You'll also need a domain name and know how to associate all of its subdomains to the IP address of your server.

### Install CouchDB

#### Debian 8

CouchDB now has an official package repository, so you just need:

```shell
curl -L https://couchdb.apache.org/repo/bintray-pubkey.asc | sudo apt-key add -
echo "deb https://apache.bintray.com/couchdb-deb jessie main" | sudo tee -a /etc/apt/sources.list.d/couchdb.list
sudo apt-get update && sudo apt-get install couchdb
```

#### Debian 9

Waiting for the package repository to support Debian Stretch, you can still build CouchDB 2.1.0 [by yourself](http://docs.couchdb.org/en/2.1.0/install/unix.html#installation-from-source).

### Install the Cozy Stack

#### Already compiled

The Cozy server is just a single binary. You can fetch one of its releases from Github:

```shell
curl -o /usr/local/bin/cozy-stack \
     -L https://github.com/cozy/cozy-stack/releases/download/2017M2-alpha/cozy-stack-linux-amd64-2017M2-alpha
chmod +x /usr/local/bin/cozy-stack
adduser --system \
        --no-create-home \
        --shell /bin/bash \
        --group --gecos \
          "Cozy" cozy
mkdir /var/log/cozy
chown cozy: /var/log/cozy
mkdir /var/lib/cozy
chown -R cozy: /var/lib/cozy
```

You can configure your server using a JSON or YAML file. Let’s fetch the sample configuration file:
```shell
mkdir /etc/cozy
curl -o /etc/cozy/cozy.yaml \
     https://raw.githubusercontent.com/cozy/cozy-stack/master/cozy.example.yaml
chown -R cozy: /etc/cozy
```

Edit this file to adapt it to your configuration. You should setup a directory to store the files. For example:
```yaml
  fs:
    url: file://localhost/var/lib/cozy
```
Don’t forget to allow Cozy user to write inside this folder.


#### Compile a recent stack

The released build may not contain the latest fixes. If you want an up to date version of the stack, you can compile it from the sources. This requires to install the Go compiler, fetch the sources and compile them:

```shell
apt-get --no-install-recommends -y install \
        ca-certificates \
        curl \
        net-tools \
        nginx \
        sudo \
        vim-tiny \
        build-essential \
        pkg-config \
        erlang \
        libicu-dev \
        libmozjs185-dev \
        libcurl4-openssl-dev \
        git
cd /tmp
curl -LO https://storage.googleapis.com/golang/go1.8.3.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.8.3.linux-amd64.tar.gz
PATH=$PATH:/usr/local/go/bin go get -u github.com/cozy/cozy-stack
cp /root/go/bin/cozy-stack /usr/local/bin/cozy-stack
chmod +x /usr/local/bin/cozy-stack
```

## Configuration

### Cozy

The Cozy server requires a main password:
```shell
sudo /usr/local/bin/cozy-stack config passwd /etc/cozy/
```

This password will be asked every time you use the `cozy-stack` command line. To prevent this, you can set the `COZY_ADMIN_PASSWORD` environment variable.

### NGinx

Let’s assume you want to host a server on `mycozy.tld` with a self-signed certificate.

Generate the certificate. We need a wild-card certificate, as every application inside Cozy will have it’s own sub-domain:


```shell
sudo openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout /etc/cozy/mycozy.tld.key \
    -out /etc/cozy/mycozy.tld.crt \
    -days 365 -subj "/CN={*.mycozy.tld}"
```


Then create a virtual host for your server by creating a file at `/etc/cozy/sites-available/mycozy.tld.conf` with the following configuration template.

=====
Then create a virtual host for your server by creating `/etc/nginx/sites-available/mycozy.tld` and enable it by creating a symbolic link:
```shell
sudo ln -s "/etc/nginx/sites-available/mycozy.tld.conf" \
       /etc/nginx/sites-enabled/
```

You can check that your configuration is valid by running
```shell
sudo nginx -t -c /etc/nginx/nginx.conf
```

And start NGinx:
```shell
sudo service nginx start
```

Or, if you use systemd:
```shell
sudo systemctl start nginx
sudo systemctl enable nginx # enable the nginx service at startup, if need to
```
#### Sample configuration files

Put this file into `/etc/nginx/sites-available` and enable it by creating a symlink in `/etc/nginx/sites-enabled`.

In this template, you need to replace the following placeholders:
  - %PORT% with the public port nginx will listen to (default should be 443);
  - %SERVER_PORT% with the private port cozy will listen to (default should be 8080);
  - %DOMAIN% with your domain of choice: `mycozy.tld` in this example

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
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    access_log /var/log/nginx/cozy.log;
}
```

### DNS

Make sure to associate `*.mycozy.tld` with the IP address of your server.

For example, add the following records to your DNS (replacing `mycozy.tld` with your domain of choice):
```
mycozy.tld   A     your IP
*.mycozy.tld CNAME mycozy.tld
```

## Running

For now, we’ll just run the server as a background job, but it is highly recommended to use some supervisor software.

First, start the server:

```shell
sudo -b -u cozy sh -c '/usr/local/bin/cozy-stack serve \
     --log-level info \
     --host 0.0.0.0 >> /var/log/cozy/cozy.log 2>> /var/log/cozy/cozy-err.log'
```

Then, create your instance and install the applications:

```shell
cozy-stack instances add \
           --host 0.0.0.0 \
           --apps drive,photos,collect,settings \
           --passphrase "XXX" \
           mycozy.tld
```

`--passphrase "XXX"` allows to set the initial password of the instance.

You can add other instances by just running this commands again.

!!! info ""
    The url of your cozy determines the name of your instance.
    If you choose another public port than the default public port for SSL (443), say `1443`, then you should reflect this when creating your cozy instance with the ${instance_domain} as `mycozy.tld:1443`.

## TODO

Cozy also requires a SMTP server (or relay).
