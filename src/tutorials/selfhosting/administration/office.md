# Online edition of office documents

Online office document edition functionality based on OnlyOffice is optional. You can use your Cozy without activating it. It let you edit your office documents online directly in your browser, however it requires more resources on your server.

To activate this functionality, you need to install OnlyOffice document server and configure cozy-stack to access it. OnlyOffice document server can be installed on the same server or on another server at your convenience. This documentation explain how to install it on the same server.

## Convenience variables

First, we define some convenience variables for all this page. Adjust values to your needs. the variable  `OO_DB_PASS` contains the password that will be set to the database user that will be created to be used by onlyoffice.

    OO_DB_PASS=OnlyOfficeDBP@ssw0rd
    DOMAIN=domain.example
    EMAIL=<your email address>


## Onlyoffice

Onlyoffice requires PostgreSQL and RabbitMQ so we will start by installing them.

### Install PostgreSQL and create database

Install PostgreSQL database

    sudo apt update
    sudo apt install -y postgresql

Create database and user for onlyoffice.

    sudo -i -u postgres psql -c "CREATE DATABASE onlyoffice;"
    sudo -i -u postgres psql -c "CREATE USER onlyoffice WITH password '${OO_DB_PASS}';"
    sudo -i -u postgres psql -c "GRANT ALL privileges ON DATABASE onlyoffice TO onlyoffice;"

If you are using postgreSQL 15 or above (on Debian 12 for example), grant onlyoffice user the permission to create table in the `public` schema

    sudo -u postgres psql -c "GRANT CREATE ON SCHEMA public TO onlyoffice;" onlyoffice

### Install RabbitMQ

If you are installing onlyoffice on the same server as couchdb, stop couchdb before installing rabbitmq to avoid any interaction between CouchDB and rabbitMQ's installation scripts. Once rabbitMQ is installed, you can restart CouchDB without any problem.

    sudo systemctl stop couchdb.service || sudo snap stop couchdb
    sudo apt install -y rabbitmq-server
    sudo systemctl start couchdb.service || sudo snap start couchdb

### Install MS core fonts

!!! note

    If using debian 12 and you didn't activate contrib sources already, activate contib sources

        cat <<EOF | sudo tee /etc/apt/sources.list.d/contrib.sources > /dev/null
        Types: deb deb-src
        URIs: mirror+file:///etc/apt/mirrors/debian.list
        Suites: $(lsb_release -sc) $(lsb_release -sc)-updates $(lsb_release -sc)-backports
        Components: contrib
        EOF
        sudo apt update

On all distribution, install Microsoft fonts

    sudo apt install -y ttf-mscorefonts-installer

When asked, accept EULA

### Install Onlyoffice Documentserver

Configure package repository

    curl -fsSL https://download.onlyoffice.com/GPG-KEY-ONLYOFFICE | sudo gpg --dearmor -o /usr/share/keyrings/onlyoffice.gpg
    echo "deb [signed-by=/usr/share/keyrings/onlyoffice.gpg] https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list
    sudo apt update

Install OnlyOffice Documentserver

    sudo apt install -y onlyoffice-documentserver jq

When asked, enter database password we created when installing postgreSQL and created database.

Then restart Nginx

    sudo systemctl reload nginx

### Configure HTTPS for OnlyOffice

Create a DNS entry for OnlyOffice targeting your server. For example:

    onlyoffice     1h     IN         A     <your_server_IP>

Generate SSL certificate:

    sudo bash /usr/bin/documentserver-letsencrypt.sh "${EMAIL}" "onlyoffice.${DOMAIN}"

Configure onlyoffice:

    sudo cp -f /etc/onlyoffice/documentserver/nginx/ds-ssl.conf.tmpl /etc/onlyoffice/documentserver/nginx/ds.conf

Add certificate path in file `/etc/onlyoffice/documentserver/nginx/ds.conf`

    sudo sed -ie 's,{{SSL_CERTIFICATE_PATH}},/etc/letsencrypt/live/onlyoffice.'${DOMAIN}'/fullchain.pem,' /etc/onlyoffice/documentserver/nginx/ds.conf
    sudo sed -ie 's,{{SSL_KEY_PATH}},/etc/letsencrypt/live/onlyoffice.'${DOMAIN}'/privkey.pem,' /etc/onlyoffice/documentserver/nginx/ds.conf

### Configure OnlyOffice for cozy-stack

Then configure onlyoffice to work with cozy-stack

    sudo cat /etc/onlyoffice/documentserver/local.json | jq '. | .services.CoAuthoring.token.enable.browser=false | del(.storage) | .services.CoAuthoring."request-filtering-agent".allowPrivateIPAddress=true | .services.CoAuthoring."request-filtering-agent".allowMetaIPAddress=true' > /tmp/oolocal.json
    cat /tmp/oolocal.json | sudo tee /etc/onlyoffice/documentserver/local.json > /dev/null
    rm /tmp/oolocal.json

Restart OnlyOffice and Nginx:

    sudo systemctl restart ds-converter.service ds-docservice.service ds-metrics.service nginx.service


You can now test onlyoffice is accessible from your browser at `https://onlyoffice.domain.example` (replace `domain.example` with your domain name).

## Configure cozy-stack for OnlyOffice

Update configuration file:

    cat <<EOF | sudo tee -a /etc/cozy/cozy.yml.local > /dev/null
    office:
      default:
        onlyoffice_url: https://onlyoffice.${DOMAIN}/
    EOF
    INBOX_SECRET="$(sudo cat /etc/onlyoffice/documentserver/local.json | jq -r .services.CoAuthoring.secret.inbox.string)"
    if [ "${INBOX_SECRET}" != "null" ]; then echo "    onlyoffice_inbox_secret: \"${INBOX_SECRET}\"" | sudo tee -a /etc/cozy/cozy.yml.local > /dev/null; fi
    OUTBOX_SECRET="$(sudo cat /etc/onlyoffice/documentserver/local.json | jq -r .services.CoAuthoring.secret.outbox.string)"
    if [ "${OUTBOX_SECRET}" != "null" ]; then echo "    onlyoffice_outbox_secret: \"${OUTBOX_SECRET}\"" | sudo tee -a /etc/cozy/cozy.yml.local > /dev/null; fi


Restart cozy-stack:

    sudo systemctl restart cozy-stack

Activate functionality:

    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    sudo COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack features defaults '{"drive.office": {"enabled": true, "write": true}}'

You can now upload an office document in cozy-drive and start editing it online by clicking on it or start a new empty document for the "New document" menu.

The `drive.office` feature flag has other options for customising the experience with OnlyOffice:

<!--lint disable list-item-bullet-indent-->

- `enabled`: Enables OnlyOffice (OO)
- `write`: Gives the right to edit. Otherwise OO opens in read mode and a modal is displayed on editing actions to warn that the functionality is blocked
- `defaultMode`: By default, OO opens in read mode (`view`). It can be switched to edit with the `edit` value.
- `touchScreen`: Corresponds to Cozy mobile applications or a browser with a screen width of 1023px or less or a user-agent on an iOS or Android operating system
    - `enabled`: Enable OnlyOffice (OO)
    - `readOnly`: Disables edit mode. You can no longer create new documents, only open existing ones in read mode without an edit button
- `mobile`: Corresponds to the browser with a screen width of 768px or less
    - `defaultMode`: By default, the opening mode is the same as the main `defaultMode`. It can be changed to either `view` reading or `edit` editing

<!--lint enable list-item-bullet-indent-->

Example :

```
{
    "enabled": true,
    "write": true,
    "defaultMode": "view"
    "touchScreen": {
        "enabled": true
        "readOnly": false
    },
    "mobile": {
        "defaultMode": "view"
    }
}
```

<div style="text-align: right">
  <a href="../">Index ^</a>
</div>
