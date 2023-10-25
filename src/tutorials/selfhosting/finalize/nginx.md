# Configure nginx and domain

Cozy relies on sub-domains for each applications you installed on your instance.
For an instance `cozy.domain.example`, `<app>.cozy.domain.example` must be available too. Currently, you need at least:

- `settings.cozy.domain.example`
- `drive.cozy.domain.example`
- `photos.cozy.domain.example`
- `home.cozy.domain.example`
- `store.cozy.domain.example`
- `<app>.cozy.domain.example` for each application you use

Follow your usual way to create those entries on your domain zone.
The simpliest way to handle this is to use a wildcard entry if supported by your domain hosting.

First create a DNS entry in your domain for `cozy.domain.example` and `*.cozy.domain.example` pointing at your server. For example:

    cozy     1h     IN         A     <your_server_IP>
    *.cozy   1h     IN     CNAME     cozy

Then install Nginx:

    sudo apt install -y nginx certbot

Like DNS, each application will use a different sub-domain and so request a certificate which include all needed domains.
Generate SSL certificate with certbot:

    DOMAIN=domain.example
    EMAIL="<your email address>"
    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d cozy.${DOMAIN} $(printf -- " -d %s.cozy.${DOMAIN}" home banks contacts drive notes passwords photos settings store mespapiers)

Create nginx reload script for your certificate to be reloaded each time it is automatically refreshed, every 3 months:

    cat <<EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
    #!/bin/bash
    nginx -t -q && nginx -s reload
    EOF
    chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

Configure nginx:

    DOMAIN=domain.example
    cat <<EOF | sudo tee /etc/nginx/sites-available/cozy.${DOMAIN} > /dev/null
    log_format with_host '$remote_addr $host $remote_user [$time_local] "$request" '
                         '$status $body_bytes_sent "$http_referer" '
                         '"$request_body"' ;

    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.cozy.${DOMAIN} cozy.${DOMAIN};
        access_log /var/log/nginx/cozy.${DOMAIN}.access.log with_host;
        error_log /var/log/nginx/cozy.${DOMAIN}.error.log;

        location /.well-known {
            alias /var/www/html/.well-known;
        }

        location / {
            return         301 https://\$host\$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/letsencrypt/live/cozy.${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/cozy.${DOMAIN}/privkey.pem;

        server_name *.cozy.${DOMAIN} cozy.${DOMAIN};
        access_log /var/log/nginx/cozy.${DOMAIN}.access.log with_host;
        error_log /var/log/nginx/cozy.${DOMAIN}.error.log;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains;";
        client_max_body_size 1g;

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Forwarded-For \$remote_addr;
        }
    }
    EOF
    sudo ln -s ../sites-available/cozy.${DOMAIN} /etc/nginx/sites-enabled/
    sudo systemctl reload nginx

You can then test from your browser by visiting `https://cozy.domain.example` and you should see a page telling you this Cozy instance doesn't exist yet. This is the sign that everything went well and the only part left is to create the instance.

<div style="text-align: right">
  <a href="../create_instance/">Next --&gt;</a>
</div>
