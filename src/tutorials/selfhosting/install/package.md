# Installing cozy-stack from precompiled package

## Cozy repositories

First, configure cozy repositories on your system.

```bash
sudo apt install ca-certificates apt-transport-https wget
```

Then, fetch the GPG Cozy signing key:

```bash
wget https://apt.cozy.io/cozy-keyring.deb -O /tmp/cozy-keyring.deb
sudo dpkg -i /tmp/cozy-keyring.deb
```

Finally, setup your repository.

```bash
DISTRIB_ID="$(lsb_release -is)"
DISTRIB_CODENAME="$(lsb_release -cs)"
echo "deb [signed-by=/usr/share/keyrings/cozy-keyring.gpg] https://apt.cozy.io/${DISTRIB_ID,,}/ ${DISTRIB_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/cozy.list > /dev/null
sudo apt update
```

## Install cozy-stack

The package installation needs to connect to CouchDB as an administrator to create a CouchDB user for cozy-stack.
When installing the cozy-stack package, it will ask you a few questions, including passwords.

!!! warning

    The passwords that you need to define are used in shell scripts so currently avoid to use one
    with simple or double quotes or others shell meaningfull symbols.
    We advise you to choose one with only alphanumeric characters to avoid trouble.

You will need to fill those mandatory parameters:

- CouchDB Address: by default, it's `127.0.0.1:5984`
- CouchDB Node name: by default, it's `couchdb@127.0.0.1`. This is needed to create a cozy user
- CouchDB Admin user: by default, it's `admin`
- CouchDB Admin password: put the one you choose during CouchDB setup
- CouchDB cozy user name: by default, it's `cozy`. This is the user that will get created in CouchDB and used by cozy-stack to access CouchDB
- CouchDB cozy user password: pick a password
- Cozy-stack admin passphrase: pick a password. This is the passphrase that will be needed to launch cozy-stack administrative commands
  For stack management (create instances, install applications...), [Cozy need an administrator password](https://docs.cozy.io/en/cozy-stack/config/#administration-secret). So pick a new one.
  When invoking `cozy-stack`, you need to set the `COZY_ADMIN_PASSWORD` environment variable with this password. You can put it on your `.bashrc` for simplier life if you want. If you don't, cozy-stack will simply ask for it.

Installing cozy-stack package is done with the following command:

```bash
sudo apt install -y cozy-stack
```

At this point, you should have a working Cozy stack, depending on the branch you've chosen you can get a different version displayed.

```bash
curl http://localhost:8080/version
```

> This command should give you cozy-stack installed version. For example:
>
> ```
> {"build_mode":"production","build_time":"2023-10-18T05:57:06Z","runtime_version":"go1.21.3","version":"2:1.6.13"}
> ```

<div style="text-align: right">
  <a href="../../finalize/nginx/">Next --&gt;</a>
</div>
