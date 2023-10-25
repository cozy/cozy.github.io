# Hosting more than one Cozy instance on the same server

Having its own selfhosted Cozy instance is nice but hosting Cozy instances for friends and family is a must! Here is how to add more Cozy instances on the same server.

The first Cozy instance we added was `https://cozy.domain.example`. We will create a second Cozy instance for Mary with address `https://mary.domain.example` (Replace `domain.example` with your own domain name and `mary` with what you want to uniquely identify the Cozy instance.

So we will need:

- Our domain name. We still use `domain.example` in this documentation
- The new Cozy instance's “slug”, which is its unique identifier. We will use `mary` here for example. The address for this new Cozy instance will the be in the form `https://<slug>.<domain>`, for example here `https://mary.domain.example`

First, let's put all that important information in variables:

    DOMAIN=domain.example
    EMAIL=<your email addresse>
    NEWSLUG=mary
    NEWEMAIL=<Mary's email address>

Create DNS entries for this Cozy instance. For example:

    mary     1h     IN         A     <your_server_IP>
    *.mary   1h     IN     CNAME     mary

Create Nginx base configuration for this Cozy instance:

    cat <<EOF | sudo tee /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null
    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};
        access_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.access.log with_host;
        error_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.error.log;

        location /.well-known {
            alias /var/www/html/.well-known;
        }

        location / {
            return         301 https://\$host\$request_uri;
        }
    }
    EOF
    sudo ln -s ../sites-available/${NEWSLUG}.${DOMAIN} /etc/nginx/sites-enabled/
    sudo systemctl reload nginx

Generate SSL certificate using certbot:

    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d ${NEWSLUG}.${DOMAIN} $(printf -- " -d %s.${NEWSLUG}.${DOMAIN}" home banks contacts drive notes passwords photos settings store mespapiers)

Finalize Nginx configuration:

    cat <<EOF | sudo tee -a /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/privkey.pem;

        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};
        access_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.access.log with_host;
        error_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.error.log;

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
    sudo systemctl reload nginx

Create Cozy instance:

    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${NEWEMAIL}" --locale fr --tz "Europe/Paris" ${NEWSLUG}.${DOMAIN}

Note the “Registration token” the last command gives you and send Mary the following url: `https://mary.domain.example?registerToken=<registration_token>`, substituting `domain.example` with your own domain name, `mary` with the slug you chose for this new instance and  `<registration_token>` with the “Registration token” returned by the last command.
By visiting this address with her browser, Mary will be able to define its password and start using her Cozy.


<div style="text-align: right">
  <a href="../">Index ^</a>
</div>
