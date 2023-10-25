# Online edition of office documents

Online office document edition functionality based on OnlyOffice is optional. You can use your Cozy without activating it. It let you edit your office documents online directly in your browser, however it requires more resources on your server.

To activate this functionality, you need to install OnlyOffice document server and configure cozy-stack to access it. OnlyOffice document server can be installed on the same server or on another server at your convenience. This documentation explain how to install it on the same server.


## Onlyoffice

Onlyoffice requires PostgreSQL and RabbitMQ so we will start by installing them.

### Install PostgreSQL and create database


    sudo apt update
    sudo -i -u postgres psql -c "CREATE DATABASE onlyoffice;"
    sudo -i -u postgres psql -c "CREATE USER onlyoffice WITH password 'onlyoffice';"
    sudo -i -u postgres psql -c "GRANT ALL privileges ON DATABASE onlyoffice TO onlyoffice;

The second command create a database user names `onlyoffice` with password `onlyoffice`. We advise you to choose a more secure password in real life.


### Install RabbitMQ

    sudo apt install -y rabbitmq-server

### Install Onlyoffice Documentserver

Configure package repository

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys CB2DE8E5
    echo "deb https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list
    sudo apt update

Install microsoft fonts

    sudo apt install -y ttf-mscorefonts-installer

When asked, accept EULA

Install OnlyOffice Documentserver

    sudo apt install -y onlyoffice-documentserver

When asked, enter database password we created when installing postgreSQL and created database.

Then restart Nginx

    sudo systemctl reload nginx

### Configure HTTPS for OnlyOffice

Create a DNS entry for OnlyOffice targeting your server. For example:

    onlyoffice     1h     IN         A     <your_server_IP>

Generate SSL certificate:

    EMAIL=<your email address>
    DOMAIN=domain.example
    sudo bash /usr/bin/documentserver-letsencrypt.sh "${EMAIL}" "onlyoffice.${DOMAIN}"

Configure onlyoffice:

    sudo cp -f /etc/onlyoffice/documentserver/nginx/ds-ssl.conf.tmpl /etc/onlyoffice/documentserver/nginx/ds.conf

Edit file `/etc/onlyoffice/documentserver/nginx/ds.conf` and

- replace `{{SSL_CERTIFICATE_PATH}}` with `/etc/letsencrypt/live/onlyoffice.domain.example/fullchain.pem`
- replace `{{SSL_KEY_PATH}}` with `/etc/letsencrypt/live/onlyoffice.domain.example/privkey.pem`

Be careful each line end with semicolons (`;`).

Restart OnlyOffice and Nginx:

    sudo supervisorctl restart all
    sudo systemctl restart nginx


You can now test onlyoffice is accessible from your browser at `https://onlyoffice.domain.example`.

## Configure cozy-stack for OnlyOffice

Update configuration file:

    DOMAIN=domain.example
    cat <<EOF | sudo tee -a /etc/cozy/cozy.yml.local > /dev/null
    office:
      default:
        onlyoffice_url: https://onlyoffice.${DOMAIN}/
    EOF

Restart cozy-stack:

    sudo systemctl restart cozy-stack

Activate functionality:

    cozy-stack features defaults '{"drive.office": {"enabled": true, "write": true}}'

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
