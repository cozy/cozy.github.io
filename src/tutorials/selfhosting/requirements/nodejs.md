# Installing NodeJS

To be able to run Cozy connectors and gather all your data, cozy-stack needs NodeJS version 16. This documents gives instructions to instal NodeJS 16.

You can refer to [NodeJS installation documentation](https://github.com/nodesource/distributions/blob/master/README.md#manual-installation) or simply follow the instructions below.

Configure NodeJS 16 package repository:

    KEYRING=/usr/share/keyrings/nodesource.gpg
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | gpg --dearmor | sudo tee "$KEYRING" >/dev/null
    echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    echo "deb-src [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list >/dev/null

Install NodeJS:

    sudo apt update
    sudo apt install -y nodejs
    sudo ln -s /usr/bin/node /usr/bin/nodejs

<div style="text-align: right">
  <a href="../../install/">Next --&gt;</a>
</div>
