# Installation de Cozy sous Ubuntu 20.04 LTS focal fossa

# Introduction

Cozycloud met à disposition des paquets deb et [des instructions d’installation](https://docs.cozy.io/en/tutorials/selfhosting/selfhost-debian-pkg/) pour Debian 10 buster à partir de ces paquets d’installation. Cependant, il n’y a pas de paquet pour Ubuntu.

Cette documentation décrit donc l’installation de Cozy à partir du code source de cozy-stack sur un serveur Ubuntu 20.04 LTS focal fossa. Nous verrons aussi comment activer l’édition en ligne de documents avec onlyoffice.


# Prérequis

L’installation nécessite :

- Un serveur sous Ubuntu 20.04 LTS focal fossa
- Un nom de domaine (indispensable pour héberger les Cozy, qu’ils soient accessibles d’internet, et sécurisés en https).
    Dans la suite de ce document, nous prendrons pour exemple le domaine `domain.example` que vous remplacerez donc par votre propre nom de domaine.
    Votre Cozy aura pour adresse `cozy.domain.example`
- De bonnes connaissances d’administration système, même si cette documentation se veut la plus simple possible à suivre

De plus, vous aurez besoin de définir au cours de l’installation :

- un mot de passe d’administration pour CouchDB
- un mot de passe pour l’accès à la base de données CouchDB
- un mot de passe d’administration pour cozy-stack
- de fournir votre email pour la création des certificats letsencrypt et la création de votre Cozy

# Couchdb

Configurer le dépôt de paquets couchdb :

    sudo apt update && sudo apt install -y curl apt-transport-https gnupg
    curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
    echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null

Installer Couchdb :

    sudo apt update
    sudo apt install -y couchdb

Lors de l’installation de couchdb, choisir le mode `Standalone` et définir le mot de passe administrateur.

Valider le bon fonctionnement de couchdb :

    curl http://localhost:5984/
    {"couchdb":"Welcome","version":"3.2.1","git_sha":"244d428af","uuid":"f7b83554fa2eb43778963d18a1f92211","features":["access-ready","partitioned","pluggable-storage-engines","reshard","scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

Enfin, créer un utilisateur et un mot de passe pour cozy-stack :

    read -p "Couchdb password for cozy user: " -r -s COUCH_PASS
    curl -fsX PUT -u "admin:adminpwd" "http://localhost:5984/_node/couchdb@127.0.0.1/_config/admins/cozy" --data "\"${COUCH_PASS}\""

Dans cette ligne de commande, `adminpwd` doit être remplacé par le mot de passe administrateur de couchdb que vous avez défini à son installation.

# NodeJS

Afin de pouvoir exécuter les connecteurs et qu’ils récupèrent vos données, cozy-stack a besoin de NodeJS version 12 ou 16. Le présent document détaille les informations pour NodeJS 16.

 Configurez l’entrepôt de paquets NodeJS :

    KEYRING=/usr/share/keyrings/nodesource.gpg
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
    echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    echo "deb-src [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list >/dev/null

Puis installez NodeJS :

    sudo apt update
    sudo apt install -y nodejs
    sudo ln -s /usr/bin/node /usr/bin/nodejs

# Go

Le serveur Cozy est développé en Go, nous aurons donc besoin d’installer le compilateur du langage Go pour pouvoir compiler depuis les sources :

    wget -O /tmp/go1.17.3.linux-amd64.tar.gz https://go.dev/dl/go1.17.3.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzvf /tmp/go1.17.3.linux-amd64.tar.gz
    echo "export PATH=\"\$PATH:/usr/local/go/bin\"" | sudo tee /etc/profile.d/golang.sh > /dev/null
    source /etc/profile.d/golang.sh

Tester que l’installation s’est bien déroulée avec :

    go version
    go version go1.17.3 linux/amd64

# Cozy-stack

Tout d’abord, Installez les dépendances :

    sudo apt install -y imagemagick libprotobuf-c1 fonts-lato

Récupérez le code source :

    sudo apt install -y git
    sudo git clone https://github.com/cozy/cozy-stack.git /opt/cozy-stack

Puis compilez le programme :

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

La compilation produit un binaire situé à `$GOPATH/bin/cozy-stack`

Vous pouvez tester la bonne compilation de la façon suivante :

    $(go env GOPATH)/bin/cozy-stack version
    1.5.0-5-gcbdf012d

Il faut ensuite Créer un utilisateur pour faire fonctionner cozy-stack :

    sudo addgroup --quiet --system cozy
    sudo adduser --quiet --system --home /var/lib/cozy \
                 --no-create-home --shell /usr/sbin/nologin \
                 --ingroup cozy cozy-stack

Puis l’installer :

    sudo install -o root -g root -m 0755 -T \
                 $(go env GOPATH)/bin/cozy-stack /usr/bin/cozy-stack
    sudo sh -c 'cozy-stack completion bash > /etc/bash_completion.d/cozy-stack'
    source /etc/bash_completion.d/cozy-stack
    sudo install -o root -g root -m 0755 -d /etc/cozy
    sudo install -o root -g cozy -m 0750 -d /var/log/cozy
    sudo install -o cozy-stack -g cozy -m 750 -d /usr/share/cozy
    sudo install -o cozy-stack -g cozy -m 750 \
                 /opt/cozy-stack/scripts/konnector-node16-run.sh \
                 /usr/share/cozy/konnector-node16-run.sh
    sudo install -o cozy-stack -g cozy -m 750 -d /var/lib/cozy


Et créer la configuration grâce à ces commandes :

    read -p "Cozy stack admin password: " -r -s COZY_PASS
    cat <<EOF | sudo tee /etc/cozy/cozy.yml >/dev/null
    host: 127.0.0.1
    port: 8080

    admin:
      host: 127.0.0.1
      port: 6060

    couchdb:
      url: http://cozy:${COUCH_PASS}@127.0.0.1:5984/

    fs:
      url: file:///var/lib/cozy

    vault:
      credentials_encryptor_key: /etc/cozy/vault.enc
      credentials_decryptor_key: /etc/cozy/vault.dec

    konnectors:
      cmd: /usr/share/cozy/konnector-node16-run.sh

    log:
      level: info
      syslog: true

    registries:
      default:
      - https://apps-registry.cozycloud.cc/selfhosted
      - https://apps-registry.cozycloud.cc/banks
      - https://apps-registry.cozycloud.cc/
    EOF
    sudo chown cozy-stack:cozy /etc/cozy/cozy.yml
    sudo chmod 0644 /etc/cozy/cozy.yml
    sudo sh -c "COZY_ADMIN_PASSPHRASE=\"${COZY_PASS}\" cozy-stack config passwd /etc/cozy/cozy-admin-passphrase"
    sudo chown cozy-stack:cozy /etc/cozy/cozy-admin-passphrase
    sudo cozy-stack config gen-keys /etc/cozy/vault
    sudo chown cozy-stack:cozy /etc/cozy/vault.enc /etc/cozy/vault.dec
    sudo chmod 0600 /etc/cozy/vault.enc /etc/cozy/vault.dec

Enfin, configurez le service systemd pour le démarrage automatique :

    cat <<EOF | sudo tee /usr/lib/systemd/system/cozy-stack.service >/dev/null
    [Unit]
    Description=Cozy service
    Wants=couchdb.service
    After=network.target couchdb.service

    [Service]
    User=cozy-stack
    Group=cozy
    WorkingDirectory=/var/lib/cozy/
    PermissionsStartOnly=true
    ExecStart=/usr/bin/cozy-stack serve
    Restart=always

    [Install]
    WantedBy=multi-user.target
    EOF
    sudo systemctl daemon-reload
    sudo systemctl enable cozy-stack
    sudo systemctl start cozy-stack

Vous pouvez valider que tout s’est bien passé et que cozy-stack fonctionne bien de la façon suivante :

    curl http://localhost:8080/version
    {"build_mode":"production","build_time":"2021-12-01T13:12:36Z","runtime_version":"go1.17.3","version":"1.5.0-5-gcbdf012d"}

# Nginx

Commencez par créer une entrée DNS dans votre domaine pour `cozy.domain.example` et `*.cozy.domain.example` qui pointe vers votre serveur. Par exemple :


    cozy     1h     IN         A     <IP_de_votre_serveur>
    *.cozy   1h     IN     CNAME     cozy

puis installez Nginx :

    sudo apt install -y nginx certbot

Générez le certificat SSL à l’aide de certbot :

    DOMAIN=domain.example
    EMAIL="<votre email>"
    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d cozy.${DOMAIN} $(printf -- " -d %s.cozy.${DOMAIN}" home banks contacts drive notes passwords photos settings store)

Pour que le nouveau certificat soit pris en compte automatiquement lors des renouvellements tous les 3 mois, créez le script de rechargement :

    cat <<EOF | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
    #!/bin/bash
    nginx -t -q && nginx -s reload
    EOF
    chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

Configurez nginx :

    DOMAIN=domain.example
    cat <<EOF | sudo tee /etc/nginx/sites-available/cozy.${DOMAIN} > /dev/null
    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.cozy.${DOMAIN} cozy.${DOMAIN};

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
        access_log /var/log/nginx/cozy.${DOMAIN}.access.log;
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

Vous pouvez tester depuis votre navigateur en vous rendant à l’adresse `https://cozy.domain.example` et vous devriez alors voir une page vous indiquant que votre Cozy n’existe pas. Dans ce cas tout s’est bien passé et il ne reste plus qu’à créer et configurer votre instance de Cozy.

# Création de l’instance Cozy

Pour créer votre instance Cozy:

    DOMAIN=domain.example
    EMAIL=<votre email>
    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${EMAIL}" --locale fr --tz "Europe/Paris" cozy.${DOMAIN}

Vous pouvez bien sur adapter la langue (`locale`) et choisir anglais (`en`) ou espagnol (`es`) ou votre timezone (`tz`).

Notez le “Registration token” que vous rend cette dernière commande et accédez depuis votre navigateur à `https://cozy.domain.example?registerToken=<le_token_retourné>` en remplaçant `domain.example` par le nom de votre domaine et ``<le_token_retourné>`` par le “Registration token” retourné par la commande précédente.
Vous pourrez ainsi définir votre mot de passe et commencer à utiliser votre Cozy.

# Et voilà !

Votre Cozy est désormais opérationnel, profitez-en pleinement ! Son adresse est `https://cozy.domain.example` (remplacez domain.example par votre nom de domaine)
Vous pouvez commencer à installer depuis le store des connecteurs pour récupérer automatiquement vos données personnelles depuis vos fournisseurs, sauver vos mots de passe dans cozy-pass, entreposer vos fichiers dans cozy-drive et installer notre client en synchronisation sur votre PC pour synchroniser automatiquement le contenu de votre Cozy avec un répertoire local.

Et ci-dessous, quelques bonus 😉

# Héberger plusieurs instances sur son serveur

Avoir un Cozy auto-hébergé, c’est bien, mais partager et proposer à la famille, aux amis un Cozy qu’on héberge pour eux parce qu’on sait faire c’est cool aussi. Voici donc comment créer un autre Cozy sur le même serveur.

Le premier Cozy que nous avons créé a pour adresse `https://cozy.domain.example`. Nous allons créer un second Cozy pour Antoinette à l’adresse `https://antoinette.domain.example` (remplacez `domain.example` par votre nom de domaine et `antoinette` par ce que vous voudrez qui identifiera le Cozy de manière unique.

Il nous faudra donc :

- Le nom de votre domaine. Nous utilisons toujours `domain.example` dans cette documentation
- le “slug” du Cozy, c’est à dire son identifiant unique. Ici nous utilisons pour l’exemple `antoinette`. L’adresse de votre Cozy sera de la forme `https://<slug>.<domain>`, par exemple ici `https://antoinette.domain.example`

Nous allons commencer par mettre dans des variables les informations importantes :

    DOMAIN=domain.example
    EMAIL=<votre adresse email>
    NEWSLUG=antoinette
    NEWEMAIL=<adresse email d'antoinette>

Créer les entrées DNS pour ce Cozy. Par exemple :

    antoinette     1h     IN         A     <IP_de_votre_serveur>
    *.antoinette   1h     IN     CNAME     antoinette

Créer la configuration de base pour ce Cozy dans nginx :

    cat <<EOF | sudo tee /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null
    server {
        listen 80;
        listen [::]:80;

        root /var/www/html;
        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};

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

Générez le certificat SSL à l’aide de certbot :

    sudo certbot certonly --email "${EMAIL}" --non-interactive --agree-tos --webroot -w /var/www/html -d ${NEWSLUG}.${DOMAIN} $(printf -- " -d %s.${NEWSLUG}.${DOMAIN}" home banks contacts drive notes passwords photos settings store)

Finalisez la configuration de nginx pour ce nouveau Cozy :

    cat <<EOF | sudo tee -a /etc/nginx/sites-available/${NEWSLUG}.${DOMAIN} > /dev/null

    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${NEWSLUG}.${DOMAIN}/privkey.pem;

        server_name *.${NEWSLUG}.${DOMAIN} ${NEWSLUG}.${DOMAIN};
        access_log /var/log/nginx/${NEWSLUG}.${DOMAIN}.access.log;
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

Créer l’instance de Cozy :

    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${NEWEMAIL}" --locale fr --tz "Europe/Paris" ${NEWSLUG}.${DOMAIN}

Notez le “Registration token” que vous rend cette dernière commande et envoyez à Antoinette l’url `https://antoinette.domain.example?registerToken=<le_token_retourné>` en remplaçant `domain.example` par le nom de votre domaine, `antoinette` par le slug que vous aurez choisi pour cette nouvelle instance de Cozy et `<le_token_retourné>` par le “Registration token” retourné par la commande précédente.

En visitant cette adresse à l’aide de son navigateur, elle pourra ainsi définir son mot de passe et commencer à utiliser son Cozy.

# Edition en ligne et collaborative de documents

La fonctionnalité d’édition en ligne de documents basée sur OnlyOffice est optionnelle. Vous pouvez utiliser votre Cozy sans l’activer. Elle permet d’éditer en ligne directement dans son navigateur ses documents office mais nécessite des ressources supplémentaires sur votre serveur.

Pour activer la fonctionnalité d’édition en ligne de documents office, avec onlyoffice, il nous faut installer le serveur de documents onlyoffice et configurer la stack Cozy pour y accéder. Le serveur de documents onlyoffice peut être installé sur le même serveur ou sur un serveur différent. Cette documentation expliquer comment le déployer sur le même serveur.

## OnlyOffice

OnlyOffice nécessite PostgreSQL et RabbitMQ pour fonctionner, nous allons donc commencer par les installer.

### Installer PostgreSQL et créer la base de données

    sudo apt update
    sudo -i -u postgres psql -c "CREATE DATABASE onlyoffice;"
    sudo -i -u postgres psql -c "CREATE USER onlyoffice WITH password 'onlyoffice';"
    sudo -i -u postgres psql -c "GRANT ALL privileges ON DATABASE onlyoffice TO onlyoffice;

La seconde ligne crée un utilisateur de bases de données `onlyoffice` dont le mot de passe est `onlyoffice`. Il est fortement recommandé de choisir un mot de passe plus sécurisé.

### Installer RabbitMQ


    sudo apt install -y rabbitmq-server

### Installer OnlyOffice Documentserver

Configurer l’entrepôt de paquets :

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys CB2DE8E5
    echo "deb https://download.onlyoffice.com/repo/debian squeeze main" | sudo tee /etc/apt/sources.list.d/onlyoffice.list
    sudo apt update

Installer les polices Microsoft :

    sudo apt install -y ttf-mscorefonts-installer

Lorsque cela vous est demandé, acceptez l’EULA

Installer OnlyOffice Documentserver :

    sudo apt install -y onlyoffice-documentserver

Lorsque cela vous est demandé, saisissez le mot de passe de base de données créé lors de l’installation de PostgreSQL et la création de la base de données.

Puis redémarrez Nginx :

    sudo systemctl reload nginx

### Configurer HTTPS pour OnlyOffice

Créer une entrée DNS pour OnlyOffice qui pointe vers votre serveur. Par exemple :

    onlyoffice     1h     IN         A     <IP_de_votre_serveur>

Créer le certificat :

    EMAIL=<votre email>
    DOMAIN=domain.example
    sudo bash /usr/bin/documentserver-letsencrypt.sh "${EMAIL}" "onlyoffice.${DOMAIN}"

Configurer OnlyOffice :

    sudo cp -f /etc/onlyoffice/documentserver/nginx/ds-ssl.conf.tmpl /etc/onlyoffice/documentserver/nginx/ds.conf

Editer le fichier `/etc/onlyoffice/documentserver/nginx/ds.conf` et

- remplacez `{{SSL_CERTIFICATE_PATH}}` par `/etc/letsencrypt/live/onlyoffice.domain.example/fullchain.pem`
- remplacez `{{SSL_KEY_PATH}}` par `/etc/letsencrypt/live/onlyoffice.domain.example/privkey.pem`

Attention, les lignes du fichier de configuration se terminent par des `;`

Redémarrer OnlyOffice et Nginx :

    sudo supervisorctl restart all
    sudo systemctl restart nginx

Vous pouvez maintenant tester que onlyoffice est bien accessible depuis votre navigateur à l’adresse `https://onlyoffice.domain.example`.


## Configurer cozy-stack pour OnlyOffice

Mettre à jour le fichier de configuration :

    DOMAIN=domain.example
    cat <<EOF | sudo tee -a /etc/cozy/cozy.yml > /dev/null
    office:
      default:
        onlyoffice_url: https://onlyoffice.${DOMAIN}/
    EOF

Redémarrer cozy-stack :

    sudo systemctl restart cozy-stack

Activer la fonctionnalité :

    cozy-stack features defaults '{"drive.onlyoffice.enabled": true}'


# Mettre à jour cozy-stack

Les applications à l’intérieur de votre Cozy se mettent à jour automatiquement, cependant, l’application cozy-stack qui tourne sur votre serveur doit être mise à jour régulièrement (une fois tous les 3 mois environ est un bon compromis entre trop et trop peu).
Voici la marche à suivre pour y parvenir :

Mettez à jour le code source :

    cd /opt/cozy-stack
    sudo git pull

Relancer la compilation :

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

Vous pouvez tester la bonne compilation de la façon suivante :

    $(go env GOPATH)/bin/cozy-stack version
    1.5.0-9-g1eac6802

Installer le nouveau binaire généré :

    sudo install -o root -g root -m 0755 -T \
                 $(go env GOPATH)/bin/cozy-stack /usr/bin/cozy-stack             

Relancer cozy-stack :

    sudo systemctl restart cozy-stack

Et voilà, vous avez mis à jour cozy-stack. c’est aussi simple que cela.

# Références
- Installation de Couchdb : [https://docs.couchdb.org/en/stable/install/unix.html](https://docs.couchdb.org/en/stable/install/unix.html)
- Installation de Go : [https://go.dev/doc/install](https://go.dev/doc/install)
- Installation de NodeJS : [https://github.com/nodesource/distributions/blob/master/README.md#manual-installation](https://github.com/nodesource/distributions/blob/master/README.md#manual-installation)
- Installation de cozy-stack : [https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md)
- Guide de configuration de cozy-stack : [https://github.com/cozy/cozy-stack/blob/master/docs/config.md](https://github.com/cozy/cozy-stack/blob/master/docs/config.md)
- Installation de OnlyOffice : [https://helpcenter.onlyoffice.com/fr/installation/docs-community-install-ubuntu.aspx](https://helpcenter.onlyoffice.com/fr/installation/docs-community-install-ubuntu.aspx)
- Configuration https OnlyOffice : [https://helpcenter.onlyoffice.com/fr/installation/docs-community-https-linux.aspx](https://helpcenter.onlyoffice.com/fr/installation/docs-community-https-linux.aspx)
- Documentation office cozy-stack : [https://docs.cozy.io/en/cozy-stack/office/](https://docs.cozy.io/en/cozy-stack/office/)
