# Installing CouchDB

Cozy-stack uses couchdb to store structured data of your cozy.

Preferred installation method is precompiled package but in case there is no package yet for your system (like on Debian 12 at the redaction of this document), you can also install couchdb using snap package.

If neither method is available for your particular system and architecture, refer to [CouchDB official installation documentation](https://docs.couchdb.org/en/stable/install/unix.html) to build it from source.

## Installing from precompiled packages

Configure CouchDB package repository:

    sudo apt update && sudo apt install -y curl apt-transport-https gnupg
    curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
    echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null

Install Couchdb:

    sudo apt update
    sudo apt install -y couchdb

During CouchDB installation, choose `Standalone` mode, define a random erlang cookie and define a couchdb admin password. Remember that password, you will need it later when installing cozy-stack.

Validate CouchDB is working:

    curl http://127.0.0.1:5984/
    {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

## Installing from snap package

Install snapd

    sudo apt install snapd
    sudo systemctl enable --now snapd.socket

Install Snap Core

    sudo snap install core

Install CouchDB snap package

    sudo snap install couchdb

Configure CouchDB admin password and start CouchDB. Be careful to replace StrongAdminPassw0rd with your chosen password

    sudo snap set couchdb admin=StrongAdminPassw0rd
    sudo snap start couchdb

Enable snap permissions

     sudo snap connect couchdb:mount-observe
     sudo snap connect couchdb:process-control

Test your CouchDB installation

    curl http://127.0.0.1:5984/
    {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

<div style="text-align: right">
  <a href="../nodejs/">Next --&gt;</a>
</div>
