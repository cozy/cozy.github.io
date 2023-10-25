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

```bash
sudo apt install cozy-stack
```

The package installation needs to connect to CouchDB as an administrator to create a CouchDB user for cozy-stack. Fill those mandatory parameters to allow this creation:

- CouchDB Address: by default, it's `localhost:5984`
- CouchDB Node name: by default, it's `couchdb@127.0.0.1`. This is needed to create a cozy user
- CouchDB Admin user: by default, it's `admin`
- CouchDB Admin password: put the one you choose during CouchDB setup
- CouchDB cozy user name: by default, it's `cozy`. This is the user that will get created in CouchDB and used by cozy-stack to access CouchDB
- CouchDB cozy user password: pick a password
- Cozy-stack admin passphrase: pick a password. This is the passphrase that will be needed to launch cozy-stack administrative commands

  (Those passwords are used by shell scripts, so currently avoid to use ones with simple or double quotes or others shell meaningfull symbols. We advice you to choose ones with only alphanumeric digits to avoid troubles.)

For stack management (create instances, install applications...), [Cozy need an administrator password](https://docs.cozy.io/en/cozy-stack/config/#administration-secret). So pick a new one.
When invoking `cozy-stack`, you need to set the `COZY_ADMIN_PASSWORD` environment variable with this password. You can put it on your `.bashrc` for simplier life if you want. If you don't, cozy-stack will simply ask for it.

At this point, you must have a working Cozy stack, depending on the branch you've chosen you can get a different version displayed.

```bash
curl http://localhost:8080/version
{"build_mode":"production","build_time":"2023-10-18T05:57:06Z","runtime_version":"go1.21.3","version":"2:1.6.13"}
```

<div style="text-align: right">
  <a href="../../finalize/nginx/">Next --&gt;</a>
</div>
