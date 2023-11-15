# Installing CouchDB from precompiled packages

Configure CouchDB package repository:

    sudo apt update && sudo apt install -y curl apt-transport-https gnupg
    curl -fsSL https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
    echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null

Install Couchdb:

    sudo apt update
    sudo apt install -y couchdb

!!! warning ""

    During CouchDB installation, you need to answer a few questions:

    - Choose `Standalone` mode
    - Define a random erlang cookie (choose any random string, this is only used in multi-server cluster configuration)
    - Define a couchdb admin password. **Remember that password**, you will need it later when installing cozy-stack.

Validate CouchDB is working:

    curl http://127.0.0.1:5984/

> The above command should give you something like
>
> ```
>    {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}
> ```

<div style="text-align: right">
  <a href="../nodejs/">Next --&gt;</a>
</div>
