# Using Apache instead of nginx

!!! note

    This page contains configuration for using apache as a reverse proxy instead of nginx. It only contains apache installation
    and configuration instructions and assume you have already managed to configure DNS entries as explained on [nginx configuration page](./nginx.md).

Install Apache and Certbot:

    sudo apt install -y apache2 certbot

We will first define some variables that will make life easier when issuing our SSL certificate and configuring apache (adjust the DOMAIN variable on the first line to your real domain name)

    DOMAIN=domain.example
    EMAIL="<your email address>"

Each application in your Cozy will use a different sub-domain and so you need a certificate which include all needed domains.
Generate SSL certificate with certbot:

    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d cozy.${DOMAIN} $(printf -- " -d %s.cozy.${DOMAIN}" home banks contacts drive notes passwords photos settings store mespapiers)

Create apache reload script for your certificate to be reloaded each time it is automatically refreshed, every 3 months:

    cat <<EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-apache.sh > /dev/null
    #!/bin/bash
    apachectl configtest && apachectl graceful
    EOF
    sudo chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/reload-apache.sh

We will first define some variables that will make life easier when issuing our SSL certificate and configuring apache (adjust the DOMAIN variable on the first line to your real domain name)

    DOMAIN=domain.example
    EMAIL="<your email address>"

Configure apache:

    cat <<EOF | sudo tee /etc/apache2/sites-available/cozy.${DOMAIN}.conf > /dev/null
    <VirtualHost *:80>
        ServerName cozy.${DOMAIN}
        ServerAlias *.cozy.${DOMAIN}

        ServerAdmin ${EMAIL}
        DocumentRoot /var/www/html

        ErrorLog ${APACHE_LOG_DIR}/cozy.${DOMAIN}_error.log
        CustomLog ${APACHE_LOG_DIR}/cozy.${DOMAIN}access.log combined

        <IfModule mod_rewrite.c>
            RewriteEngine on
            RewriteCond %{REQUEST_URI} !^/.well-known/.*$ [NC]
            RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
        </IfModule>

    </VirtualHost>

    <VirtualHost _default_:443>
        ServerName cozy.${DOMAIN}
        ServerAlias *.cozy.${DOMAIN}

        ServerAdmin ${EMAIL}
        DocumentRoot /var/www/html

        ErrorLog ${APACHE_LOG_DIR}/cozy.${DOMAIN}_error.log
        CustomLog ${APACHE_LOG_DIR}/cozy.${DOMAIN}_access.log combined

        SSLEngine on
        SSLCertificateFile /etc/letsencrypt/live/cozy.${DOMAIN}/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/cozy.${DOMAIN}/privkey.pem
        Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains;"

        LimitRequestBody  1073741824

        ProxyPass         / http://127.0.0.1:8080/ retry=0 Keepalive=On timeout=1600 upgrade=websocket
        ProxyPassReverse  / http://127.0.0.1:8080/
        ProxyPreserveHost On
    </VirtualHost>
    EOF
    sudo a2ensite cozy.${DOMAIN}.conf

Then enable required apache modules and restart apache

    sudo a2enmod ssl rewrite headers proxy proxy_http
    sudo systemctl restart apache2

You can then test from your browser by visiting `https://cozy.domain.example` and you should see a page telling you this Cozy instance doesn't exist yet. This is the sign that everything went well and the only part left is to create the instance.

<div style="text-align: right">
  <a href="../create_instance/">Next --&gt;</a>
</div>
