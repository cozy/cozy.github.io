# How to install Cozy on Debian Jessie

!!! warning ""
    ⚠️ This is a work in progress. For now, there’s no easy and officially supported way to install Cozy. You have to install it and all this dependencies by hand. This tutorial is intended for tech savvy people wanting to give Cozy a first try without waiting for the official documentation and images.


## Pre-requisites

Cozy requires a CouchDB 2 database server and a reverse proxy. We’ll use Nginx in this tutorial but feel free to use your reverse proxy of choice.

## Install dependencies

On a fresh new Debian Jessie, here are the packages that may be useful to install and manage your server:

```shell
apt-get update && apt-get --no-install-recommends -y install \
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
            libcurl4-openssl-dev
```

### Install CouchDB

Download [the source code on CouchDB 2](http://couchdb.apache.org/) and [install it](http://docs.couchdb.org/en/2.0.0/install/unix.html).

```shell
cd /tmp
curl -LO https://dist.apache.org/repos/dist/release/couchdb/source/2.0.0/apache-couchdb-2.0.0.tar.gz
tar xf apache-couchdb-2.0.0.tar.gz
cd apache-couchdb-2.0.0
./configure
make release
adduser --system \
        --no-create-home \
        --shell /bin/bash \
        --group --gecos \
        "CouchDB Administrator" couchdb
```

We’ll install CouchDB inside `/home/couchdb`:
```shell
cp -R rel/couchdb /home/couchdb
chown -R couchdb:couchdb /home/couchdb
find /home/couchdb -type d -exec chmod 0770 {} \;
chmod -R 0644 /home/couchdb/etc
mkdir /var/log/couchdb && chown couchdb: /var/log/couchdb
```

For now, we’ll just run the database as a background job, but it is highly recommended to use some supervisor software.

```shell
sudo -b -i -u couchdb sh -c '/home/couchdb/bin/couchdb >> /var/log/couchdb/couch.log 2>> /var/log/couchdb/couch-err.log'
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
curl -o /usr/local/bin/cozy-stack -L https://github.com/cozy/cozy-stack/releases/download/2017M1-alpha/cozy-stack-linux-amd64-2017M1-alpha
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
curl -o /etc/cozy/cozy.yaml https://raw.githubusercontent.com/cozy/cozy-stack/master/cozy.example.yaml
chown -R cozy: /etc/cozy
```

Edit this file to adapt it to your configuration. You should setup a directory to store the files. For example:
```yaml
  fs:
    url: file://localhost/var/lib/cozy
```
Don’t forget to allow Cozy user to write inside this folder.

## Configuration

### NGinx

Let’s assume you want to host a server on `mycozy.tld` with a self-signed certificate.

Generate the certificate. We need a wild-card certificate, as every application inside Cozy will have it’s own sub-domain:


```shell
openssl req -x509 -nodes -newkey rsa:4096 \
    -keyout /etc/cozy/mycozy.tld.key \
    -out /etc/cozy/mycozy.tld.crt \
    -days 365 -subj "/CN={*.mycozy.tld}"
```

Then create a virtual host for your server by creating `/etc/cozy/sites-available/mycozy.tld` and enable it by creating a symbolic link:
```shell
ln -s "/etc/nginx/sites-available/${instance_domain}.conf" /etc/nginx/sites-enabled/
```

And start NGinx:
```shell
service nginx start
```

### Cozy

The Cozy server requires a main password:
```shell
/usr/local/bin/cozy-stack config passwd /etc/cozy/
```

This password will be asked every time you use the `cozy-stack` command line. To prevent this, you can set the `COZY_ADMIN_PASSWORD` environment variable.


## Running

For now, we’ll just run the server as a background job, but it is highly recommended to use some supervisor software.

First, start the server:

```shell
sudo -b -u cozy sh -c '/usr/local/bin/cozy-stack serve \
     --log-level debug \
     --host 0.0.0.0 >> /var/log/cozy/cozy.log 2 >> /var/log/cozy/cozy-err.log
```

Then, create your instance:

```shell
cozy-stack instances add \
           --host 0.0.0.0 \
           --apps files,settings,onboarding \
           --passphrase "XXX" \
           mycozy.tld
```

You can add other instances by just running this command again.


## TODO

Cozy also requires a SMTP server (or relay).
