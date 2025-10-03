# Running Cozy inside Docker

## Introduction

Cozycloud publish the `cozy/cozy-stack` docker production image to run the
`cozy-stack` inside a docker container. It comes with everything bundled and
preconfigured:

- `cozy-stack` backend server
- asynchronous konnector and services execution
- preconfigured PDF and SVG thumbnail generation
- Mail relay
- ...

Cozycloud also publish a docker-compose onfiguration to automatically
setup a whole Cozy hosting infrastructure inside docker for selfhosting
purposes with a CouchDB database as well as a frontend reverse proxy with
on-demand TLS (automatic TLS certificate issuance).

This guide will help you selfhost your Cozy inside docker with docker-compose.

## Requirements

First you need a working docker installation with compose plugin.

Plense refer to official [Docker installation guide](https://docs.docker.com/engine/install/) for detailed instructions.

If you don't work as root, add your unpriviledged user to the `docker` group.
Refer to docker documentation on
[how to manage docker as a non-root user](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user)

!!! note

    docker-compose comes in two flavor. The first, v1, is a serapate python
    executable called `docker-compose`, the second, v2, is a plugin to the
    `docker` command called with `docker compose` (with a space instead of a
    dash between `docker` and `compose`).

    In this documentation, we will use the newer `docker compose` version.
    If you still use the old separate executable, remplace all `docker compose`
    occurences with `docker-compose`

You also need a domain name or a subdomain under which all your cozy instances
will reside. For example, if you want all your cozy instances under the
`domain.example` domain. Configure your domain to point to your server in your
domain's DNS:

```dns
@   IN  A   <your server IP>
*   IN  A   <your server IP>
```

If you prefer tu use a subdomain of your main domain, in case you use it for
anything else, simply create DNS entries pointing to your server for that
subdomain. For exmaple if you want all your instances to be located under
the `cozy` subdomain of your `domain.example` domain, you need to add a
wildcard dns entry to your server like this:

```dns
cozy      IN  A   <your server IP>
*.cozy    IN  A   <your server IP>
```

## Clone cozy-stack docker-compose repository

```bash
sudo git clone https://github.com/cozy/cozy-stack-compose.git /opt/cozy
sudo chown -R `whoami`: /opt/cozy
```

## Configuration

Copy the configuration file `env.template` file to `.env`

```bash
cd /opt/cozy
cp env.example .env
```

and edit this `.env` file to configure your environment.

You should at least edit the following variables:

- `DOMAIN`: The domain under which all your instances will be served.
  In our example, it's `domain.example` or `cozy.domain.example` if you use
  a subdomain.
- `ACME_EMAIL`: The email under which you want the TLS certificates to be
  issued with Let's Encrypt
- `COUCHDB_PASSWORD`: Generate and define a strong password for cozy-stack to
  connect to CouchDB
- `COZY_ADMIN_PASSPHRASE`: The cozy-stack administrative password. Generate
  and define a strong admin password. If unset a random password will be chosen
  and shown in stack logs. If you want cozy-stack cli to ask for the password
  everytime, you can undefine this variable and restart container after the
  first run

## Starting the environment

You can then start with

```bash
cd /opt/cozy
docker compose up -d
```

## Create instance

To execute `cozy-stack` commands inside the docker container, you can use the
provided `cozy-stack.sh` script that executes the `cozy-stack` command inside
the docker container with provided arguments.

You can execute any `cozy-stack` command by simply replacing `cozy-stack` with
`./cozy-stack.sh`

For example:

```bash
cd /opt/cozy
./cozy-stack.sh status
```

To create your first instance:

```bash
cd /opt/cozy
./cozy-stack.sh instances add \
    --apps home,banks,contacts,drive,notes,passwords,photos,settings,store \
    --email "your.email@domain.example" \
    --locale fr \
    --tz "Europe/Paris" \
    --passphrase YourStrongP@ssw0rd \
    myinstance.domain.example
```

And then direct your browser to <https://myinstance.domain.example>.

The first time you access an application it will take a handful of seconds for
the Caddy reverse proxy to automatically generate the TLS certificate.

All data will be stored in a `volumes` subdirectory. You can backup them.

## Going further

### Debugging

You can list running containers with their state with

```bash
cd /opt/cozy
docker compose ps
```

In case something gets wrong, you can access logs from docker compose.

**cozy-stack logs**

```bash
cd /opt/cozy
docker compose logs stack
```

**Caddy reverse proxy**

```bash
cd /opt/cozy
docker compose logs caddy
```

**CouchDB logs**

```bash
cd /opt/cozy
docker compose logs couchdb
```

### Stopping environment

Simply run

```bash
cd /opt/cozy
docker compose down
```

### Upgrading

To upgrade to latest version, you need to stop the whole environment, pull the
new images and restart it. Carefully plan the upgrade as it will lead to
service interruption during the upgrade.

```bash
cd /opt/cozy
docker compose down
git pull
docker compose pull
docker compose up -d
```
