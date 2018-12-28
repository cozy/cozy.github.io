---
title: Cozy OnBoarding
summary: Install your development environment and get your computer ready
---

# Get Started !

Follow the **OnBoarding PDF** to create account, get your email, etc...
Specially, don't forget to :
- Encrypt your hard Drive
- Create a SSH Key: `ssh-keygen -f ~/.ssh/cozy-key -C "email@cozycloud.cc"` (Don't forget to add it again at each boot 'ssh-add ~/.ssh/cozy-key')

Keep your **Onboarding sheet** up to date

# Lib

- Install [Node.js](https://nodejs.org/download/release/v8.11.3/){:target="_blank"} . ([How to install Node.js via binary archive on Linux?](https://github.com/nodejs/help/wiki/Installation)){:target="_blank"}
- Install [Yarn](https://yarnpkg.com/en/docs/install){:target="_blank"}
- Install [GO](https://golang.org/doc/install?download){:target="_blank"}
- Install Docker
  - [Install Docker for OSX][docker-osx]{:target="_blank"}
  - [Install Docker for Windows][docker-windows]{:target="_blank"} (We have been told that installing Docker on some familial flavours of Windows may be a bit difficult. It has not been tested yet for this documentation.)
  - Install Docker for GNU/linux: [Ubuntu][docker-ubuntu]{:target="_blank"} / [Fedora][docker-fedora]{:target="_blank"} / [Debian][docker-debian]{:target="_blank"} / [CentOs][docker-centos]{:target="_blank"}


# Install Cozy

## CouchDB

This will run a new instance of CouchDB in `single` mode (no cluster) and in
`admin-party-mode` (no user). This command exposes couchdb on the port `5984`.

```bash
$ docker run -d \
    --name cozy-stack-couch \
    -p 5984:5984 \
    -v $HOME/.cozy-stack-couch:/opt/couchdb/data \
    apache/couchdb:2.3
$ curl -X PUT http://127.0.0.1:5984/{_users,_replicator,_global_changes}
```

Verify your installation at: http://127.0.0.1:5984/_utils/#verifyinstall


## [Cozy-stack](https://docs.cozy.io/en/cozy-stack/INSTALL/){:target="_blank"}
Don't follow the tutorial to build the stack via Docker, it's not working for the moment

#### Using `go`

[Install go](https://golang.org/doc/install), version >= 1.9. With `go`
installed and configured, you can run the following command:

```
go get -u github.com/cozy/cozy-stack
```

This will fetch the sources in `$GOPATH/src/github.com/cozy/cozy-stack` and
build a binary in `$GOPATH/bin/cozy-stack`.

Don't forget to add your `$GOPATH` to your `$PATH` in your `*rc` file so that
you can execute the binary without entering its full path.

```
export PATH="$(go env GOPATH)/bin:$PATH"
```

### Add an instance for testing

You can configure your `cozy-stack` using a configuration file or different
comand line arguments. Assuming CouchDB is installed and running on default port
`5984`, you can start the server:

```bash
cozy-stack serve
```

And then create an instance for development:

```bash
cozy-stack instances add --dev --apps drive,photos,settings --passphrase cozy "cozy.tools:8080"
```

The cozy-stack server listens on http://cozy.tools:8080/ by default. See
`cozy-stack --help` for more informations.

The above command will create an instance on http://cozy.tools:8080/ with the
passphrase `cozy`.

Make sure the full stack is up with:

```bash
curl -H 'Accept: application/json' 'http://cozy.tools:8080/status/'
```

You can then remove your test instance:

```bash
cozy-stack instances rm cozy.tools:8080
```

## Cozy-drive, et cozy-photos

You can check-out the master branch
```
$ git clone https://github.com/cozy/cozy-drive.git
$ cd cozy-drive
$ yarn install
```

But you'll need to check with your team the process for Pull request : some use branch, some use fork...
Hence maybe changing your clone command

# Start your servers

In your cozy-drive folder, star watching the app you want to work on :
`yarn watch:photos:browser` or `yarn watch:drive:browser`
All commands can be found in https://github.com/cozy/cozy-drive/blob/master/package.json

In $GOPATH

` ./cozy-stack serve --appdir APPNAME:PATHTOCOZY/cozy-drive/build/photos`
or ` ./cozy-stack serve --appdir APPNAME:PATHTOCOZY/cozy-drive/build/drive`

Open your favorite browser, and go to APPNAME.cozy.tools:8080
You are now running your local Cozy!

## References and more
- https://docs.cozy.io/en/cozy-stack/docker/
- https://docs.cozy.io/en/cozy-stack/INSTALL/
- https://docs.cozy.io/en/tutorials/app/#install-the-development-environment
