---
title: Install Cozy on a Debian server
summary: Self-host your own Cozy
---

A Debian repository serves packages to setup a Cozy self-hosted environment.

It provides:

- `cozy-couchdb`: [CouchDB](https://couchdb.apache.org/) database engine used by cozy
- `cozy-nsjail`: [NSJail](http://nsjail.com/) isolation tool used by konnectors
- `cozy-stack`: [Cozy core](https://github.com/cozy/cozy-stack/)
- `cozy-coclyco`: [CLI](https://github.com/cozy/cozy-coclyco/) to manage vhosts and certificates
- `cozy`: metapackage installing everything to setup a self-hosted environment

This repository currently supports:

- **Debian Buster** (10.x): amd64 armhf arm64
- **Raspbian Buster** (10.x): armhf

Available channels are:

- **testing**: Updated ± twice a month.

`cozy-couchdb` and `cozy-nsjail` are temporary packages. They will be removed when official `couchdb` and `nsjail` will be available

You can choose to install `cozy-couchdb` on the same host as `cozy-stack`, or use a remote CouchDB server. Cozy only needs a 2.x CouchDB (1.x not supported).

Like CouchDB, you can choose to install your reverse proxy on the same host, or use a remote one. Right now `cozy-coclyco` supports only local `nginx`. If you want to use `apache2` or remote reverse proxy, you need to manually configure it for vhost or TLS certificate issuances.

## Prerequisites

### Third party repositories

Cozy requires NodeJS 12, but this version is not available on official distribution repositories.
You need to activate NodeSource repository, following the documentation available [here](https://github.com/nodesource/distributions#user-content-installation-instructions)

### Cozy repositories

First, install the packages required to install cozy

```bash
apt install ca-certificates apt-transport-https wget
```

Then, fetch the GPG Cozy signing key:

```bash
wget https://apt.cozy.io/cozy-keyring.deb
dpkg -i cozy-keyring.deb
```

Finally, setup your repository. Select the channel that best fit your needs:

!!! warning ""
    For now, we recommend to use `testing` repositories.
    `stable` packages are quite old and currently provide deprecated and unsecured CouchDB version (2.0.x).
    Adapt your `sources.list` accordingly.

Supported repositories are:

- Debian Buster (10.x)
  - deb <https://apt.cozy.io/debian/> buster testing
- Raspbian Buster (10.x)
  - deb <https://apt.cozy.io/raspbian/> buster testing

```bash
echo "deb https://apt.cozy.io/debian/ buster testing" > /etc/apt/sources.list.d/cozy.list
apt update
```

## Setup

For the rest of this document, we assume you install components one by one to allow intermediate verification

For a full local environment (`couchdb` + `nginx` + `cozy`), just install the `cozy` package which can install all needed packages in one shot.

### CouchDB

```bash
apt install cozy-couchdb
```

Install CouchDB in `standalone` mode

Configure CouchDB to listen on `127.0.0.1`

Pick an administrator password
(This password is used by shell scripts, so currently avoid to use one with simple or double quotes or others shell meaningfull symbols. We advice you to choose one with only alphanumeric digits to avoid troubles.)

At this point, you must have a working CouchDB instance

```bash
curl http://localhost:5984/
{"couchdb":"Welcome","version":"2.1.0","features":["scheduler"],"vendor":{"name":"The Apache Software Foundation"}}
```

### Cozy stack

```bash
apt install cozy-stack
```

Cozy need to create a CouchDB administrator and so to connect as admin to the CouchDB. Fill those mandatory parameters to allow this creation:

- Address: by default, it's `localhost:5984`
- Node name: by default, it's `couchdb@localhost`
- Admin user: by default, it's `admin`
- Admin password: put the one you choose during CouchDB setup
- Cozy user: by default, it's `cozy`
- Cozy password: pick a password

  (Those passwords are used by shell scripts, so currently avoid to use ones with simple or double quotes or others shell meaningfull symbols. We advice you to choose ones with only alphanumeric digits to avoid troubles.)

For stack management (create instances, install applications...), [Cozy need an administrator password](https://github.com/cozy/cozy-stack/blob/2ae446d85b60c89fb56cad1f7ed469cddca94494/docs/config.md#user-content-administration-secret). So pick a new one.
When invoking `cozy-stack` (or `cozy-coclyco` which use it under the hood), you need to set the `COZY_ADMIN_PASSWORD` environment variable with this password. You can put it on your `.bashrc` for simplier life if you want. If you don't, cozy-stack will simply ask for it.

At this point, you must have a working Cozy stack, depending on the branch you've chosen you can get a different version displayed.

```bash
curl http://localhost:8080/version
{"build_mode":"production","build_time":"2017-09-28T10:26:03Z","runtime_version":"go1.8.1","version":"0.1.0"}#
```

You need to enable user namespaces and set permanently :

```bash
sysctl -w kernel.unprivileged_userns_clone=1
echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/99-cozy.conf
```

### Finally

```bash
apt install cozy
```

## Cozy instance setup

### DNS

Cozy relies on sub-domains for each applications you installed on your instance.
For an instance `cozy.example.org`, `<app>.cozy.example.org` must be available too. Currently, you need at least:

- `settings.cozy.example.org`
- `drive.cozy.example.org`
- `photos.cozy.example.org`
- `home.cozy.example.org`
- `store.cozy.example.org`
- `<app>.cozy.example.org` for each application you use

Follow your usual way to create those entries on your domain zone.
The simpliest way to handle this is to use a wildcard entry if supported by your domain hosting.

```
cozy 1h IN A x.x.x.x
*.cozy 1h IN CNAME cozy
```

### ACME (Let's Encrypt)

Like DNS, each application will use a different sub-domain and so request a certificate which include all needed domains.

`cozy-coclyco` use Let's Encrypt and its ACME protocol to prove your ownership on the domain you try to issue a certificate for.
This protocol requires your reverse proxy to be able to serve `http://<app>.cozy.example.org/.well-known/acme-challenge/` requests correctly.

The simplest way to achieve this is to configure your reverse proxy with a generic rule to forward any `/.well-known/acme-challenge/` request to the corresponding `/etc
/ssl/private/acme-challenge/` folder.
For `nginx`, this can be done by editing the `server` section of your `/etc/nginx/sites-available/default` configuration file:

```
server {
	listen 80 default_server;
	listen [::]:80 default_server;

	root /var/www/html;
	server_name _;

	location /.well-known/acme-challenge/ {
		alias /etc/ssl/private/acme-challenge/;
	}

	location / {
		return 301 https://$host$request_uri;
	}
}
```

You will then have to install `ssl-cert` package, add `www-data` user to `ssl-cert` group and restart nginx

```bash
apt install ssl-cert
adduser www-data ssl-cert
systemctl restart nginx
```

### Create instances

Once you've got a stack, your DNS and your reverse proxy correctly configured, you can create instances on your Cozy stack.
Remember to set the `COZY_ADMIN_PASSWORD` environment variable.

```bash
export COZY_ADMIN_PASSWORD=<your-admin-password>
cozy-coclyco create cozy.example.org me@example.org
```

For complete reference of Coclyco, refer to the documentation of [cozy-coclyco](https://github.com/cozy/cozy-coclyco/blob/master/README.md).
