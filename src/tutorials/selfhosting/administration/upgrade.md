# Upgrading cozy-stack

Applications inside your Cozy are automatically updated, however, cozy-stack application running on your server must be updated from time to time (once every 3 month is a good compromise between too much and too few). Upgrading cozy-stack ensure you get new features and security improvements.

The way to update cozy-stack differ wether you installed it from precompiled package or from sources.

## Upgading precompiled package

    sudo apt update
    sudo apt install --only-upgrade cozy-stack

## Upgrading from sources

Update source code:

    cd /opt/cozy-stack
    git pull

compile source code:

    cd /opt/cozy-stack
    scripts/build.sh release $(go env GOPATH)/bin/cozy-stack

You can test compilation produced a valid binary with:

    $(go env GOPATH)/bin/cozy-stack version
    1.5.0-9-g1eac6802

Install new generated binary:

    sudo install -o root -g root -m 0755 -T \
                 $(go env GOPATH)/bin/cozy-stack /usr/bin/cozy-stack

Restart cozy-stack:

    sudo systemctl restart cozy-stack

Check out installation documentation and adjust your cozy-stack configuration if needed.

Et voilà, you just upgraded cozy-stack to the latest version. pretty easy.

<div style="text-align: right">
  <a href="../">Index ^</a>
</div>

