# Installing CouchDB from snap package

!!! warning

    Only install snap package if you can't install the precompiled package for your system.

Install snapd

    sudo apt install snapd
    sudo systemctl enable --now snapd.socket

Install Snap Core

    sudo snap install core

Install CouchDB snap package

    sudo snap install couchdb

Configure CouchDB admin password and start CouchDB. **Be careful to replace StrongAdminPassw0rd with your chosen password**.

    sudo snap set couchdb admin=StrongAdminPassw0rd
    sudo snap start couchdb

!!! warning

    Don't forget your CouchDB admin password, you will need to provide it to cozy-stack at installation time

Enable snap permissions

    sudo snap connect couchdb:mount-observe
    sudo snap connect couchdb:process-control

Test your CouchDB installation

    curl http://127.0.0.1:5984/

> The above command should give you something like
>
> ```
> {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}
> ```

Create system databases. These databases are created automatically when installing couchdb from debian package but should be created manually when installing using snap.
Replace StrongAdminPassw0rd with the password you chose previously.

    curl -u "admin:StrongAdminPassw0rd" -X PUT http://localhost:5984/_users
    curl -u "admin:StrongAdminPassw0rd" -X PUT http://localhost:5984/_replicator

<div style="text-align: right">
  <a href="../nodejs/">Next --&gt;</a>
</div>
