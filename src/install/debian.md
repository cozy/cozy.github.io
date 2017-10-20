A Debian repository serves packages to setup a Cozy self-hosted environment

It provides:

 * `cozy-couchdb`: [CouchDB](https://couchdb.apache.org/) database engine used by cozy
 * `cozy-nsjail`: [NSJail](http://nsjail.com/) isolation tool used by konnectors
 * `cozy-stack`: [Cozy core](https://github.com/cozy/cozy-stack/)
 * `cozy-coclyco`: [CLI](https://github.com/cozy/cozy-coclyco/) to manage vhosts and certificates
 * `cozy`: metapackage installing everything to setup a self-hosted environment

This repository currently supports:

 * __Debian Stretch__ (9.x): amd64
 * __Ubuntu Xenial__ (16.04 LTS): amd64
 * __Raspbian Stretch__ (9.x): armhf

Available channels are:

 * __stable__: official and supported releases
 * __testing__: future official releases, for testing purposes
 * __unstable__: nightly builds, to be use with caution

`cozy-couchdb` and `cozy-nsjail` are temporary packages. They will be removed when official `couchd` and `nsjail` will be available

You can choose to install `cozy-couchdb` on the same host as `cozy-stack`, or use a remote CouchDB server. Cozy only needs a 2.x CouchDB (1.x not supported).

Like CouchDB, you can choose to install your reverse proxy on the same host, or use a remote one. At this `cozy-coclyco` supports only local `nginx`. If you want to use `apache2` or remote reverse proxy, you need to manually configure it for vhost or TLS certificate issuances.

# Prerequisites

Setup your repository and fetch the GPG Cozy signing key.

Change your channel if you prefer `testing` or `unstable` or an other distribution.
Supported repositories are:

 * Debian Stretch (9.x)
     * deb https://apt.cozy.io/debian/ stretch stable
     * deb https://apt.cozy.io/debian/ stretch testing
     * deb https://apt.cozy.io/nightly/debian/ stretch unstable
 * Ubuntu Xenial (16.04 LTS)
     * deb https://apt.cozy.io/ubuntu/ xenial stable
     * deb https://apt.cozy.io/ubuntu/ xenial testing
     * deb https://apt.cozy.io/nightly/ubuntu/ xenial unstable
 * Raspbian Stretch (9.x)
     * deb https://apt.cozy.io/raspbian/ stretch stable
     * deb https://apt.cozy.io/raspbian/ stretch testing
     * deb https://apt.cozy.io/nightly/raspbian/ stretch unstable

```bash
echo "deb https://apt.cozy.io/debian/ stretch stable" > /etc/apt/sources.list.d/cozy.list
curl https://apt.cozy.io/cozy.gpg | \
	apt-key --keyring /etc/apt/trusted.gpg.d/cozy.gpg add -
apt update
```

If you want to use unstable/nightly builds, you have to accept another key (weaker and passwordless on our side because of unattended automated builds)

```bash
curl https://apt.cozy.io/nightly/cozy.gpg | \
    apt-key --keyring /etc/apt/trusted.gpg.d/cozy.gpg add -
```

__Currently, only `unstable` is populated, waiting for feedback about packages usability before testing & stable release.__

# Setup

For the rest of this document, we assume you install components one by one to allow intermediate verification

For a full local environment (`couchdb` + `nginx` + `cozy`), just install the `cozy` package which can install all needed packages in one shot.

## CouchDB

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

## Cozy stack

```bash
apt install cozy-stack
```

Cozy need to create a CouchDB administrator and so to connect as admin to the CouchDB. Fill those mandatory parameters to allow this creation:

 * Address: by default, it's `localhost:5984`
 * Node name: by default, it's `couchdb@localhost`
 * Admin user: by default, it's `admin`
 * Admin password: put the one you choose during CouchDB setup
 * Cozy user: by default, it's `cozy`
 * Cozy password: pick a password

 (Those passwords are used by shell scripts, so currently avoid to use ones with simple or double quotes or others shell meaningfull symbols. We advice you to choose ones with only alphanumeric digits to avoid troubles.)

For stack management (create instances, install applications...), [Cozy need an administrator password](https://github.com/cozy/cozy-stack/blob/2ae446d85b60c89fb56cad1f7ed469cddca94494/docs/config.md#user-content-administration-secret). So pick a new one.  
When invoking `cozy-stack` (or `cozy-coclyco` which use it under the hood), you need to set the `COZY_ADMIN_PASSWORD` environment variable with this password. You can put it on your `.bashrc` for simplier life if you want.

At this point, you must have a working Cozy stack

```bash
curl http://localhost:8080/version
{"build_mode":"production","build_time":"2017-09-28T10:26:03Z","runtime_version":"go1.8.1","version":"0.1.0"}#
```

If you want to use konnectors, you need to initialize the NodeJS chroot

(Currently this script only works for Debian and will be adapted for Ubuntu and Raspbian soon)

```bash
/usr/share/cozy/konnector-create-chroot.sh
```

If you use a self-signed certificate or a not official certificate authority, you need to deploy the corresponding root certificate in `/usr/share/cozy/chroot/etc/ssl/certs/custom.crt`.  
For example, if you use [Let's Encrypt staging environment](https://letsencrypt.org/docs/staging-environment/) for testing purpose :

```bash
wget -q https://letsencrypt.org/certs/fakelerootx1.pem \
    -O /usr/share/cozy/chroot/etc/ssl/certs/custom.crt
```

## Finally

```bash
apt install cozy
```

# Cozy instance setup

## DNS

Cozy relies on sub-domains for each applications you installed on your instance.
For an instance `cozy.example.org`, `<app>.cozy.example.org` must be available too. Currently, you need at least:

 * `onboarding.cozy.example.org`
 * `settings.cozy.example.org`
 * `drive.cozy.example.org`
 * `photos.cozy.example.org`
 * `collect.cozy.example.org`
 * `store.cozy.example.org`
 * `<app>.cozy.example.org` for each application you use

Follow your usual way to create those entries on your domain zone.
The simpliest way to handle this is to use a wildcard entry if supported by your domain hosting.

```
cozy 1h IN A x.x.x.x
*.cozy 1h IN CNAME cozy
```

## ACME (Let's Encrypt)

Like DNS, each application will use a different sub-domain and so request a certificate which include all needed domains.

`cozy-coclyco` use Let's Encrypt and it ACME protocol to prove your ownership over the domain you try to issue a certificate.
This protocol requires your reverse proxy to be able to serve `http://<app>.cozy.example.org/.well-known/acme-challenge/` requests correctly.

The simplest way to achieve this is to configure your reverse proxy with a generic rule to forward any `/.well-known/acme-challenge/` request to the corresponding `/etc
/ssl/private/acme-challenge/` folder.
For `nginx`, this can be done with

```
/etc/nginx/sites-available/default
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

apt install ssl-cert
adduser www-data ssl-cert
systemctl restart nginx
```

## Create instances

Once you've got a stack, your DNS and your reverse proxy correctly configured, you can create instances on your Cozy stack.
Remember to set the `COZY_ADMIN_PASSWORD` environment variable.

```bash
export COZY_ADMIN_PASSWORD=<your-admin-password>
cozy-coclyco create cozy.example.org me@example.org
```

For complete reference of Coclyco, refer to the documentation of [cozy-coclyco](https://github.com/cozy/cozy-coclyco/blob/master/README.md).
