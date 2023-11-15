# Installing NodeJS

To be able to run Cozy connectors and gather all your data, cozy-stack needs NodeJS version 16. This documents gives instructions to instal NodeJS 16.

You can refer to [NodeJS installation documentation](https://github.com/nodesource/distributions/blob/master/README.md#manual-installation) or simply follow the instructions below.

Add NodeJS 16 package repository to your system:

    KEYRING=/usr/share/keyrings/nodesource.gpg
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o "$KEYRING"
    echo "deb [signed-by=$KEYRING] https://deb.nodesource.com/node_16.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list >/dev/null
    cat <<EOF | sudo tee /etc/apt/preferences.d/nodejs.pref > /dev/null
    Package: *
    Pin: origin deb.nodesource.com
    Pin-Priority: 700
    EOF

Install NodeJS:

    sudo apt update && sudo apt install -y nodejs

Verify that NodeJS 16 is properly installed

    nodejs --version

> This command should give you nodejs installed version. For example:
>
> ```
>     v16.20.2
> ```

<div style="text-align: right">
  <a href="../../install/">Next --&gt;</a>
</div>
