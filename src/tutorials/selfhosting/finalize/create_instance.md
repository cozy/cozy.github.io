# Create your first cozy instance

## Create your First Cozy instance:

First define some variable you will need to configure your instance

    DOMAIN=domain.example
    EMAIL=<your email address>

Then create the instance

    [[ -z "${COZY_PASS}" ]] && read -p "Cozy stack admin password: " -r -s COZY_PASS
    sudo COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances add --apps home,banks,contacts,drive,notes,passwords,photos,settings,store --email "${EMAIL}" --locale fr --tz "Europe/Paris" cozy.${DOMAIN}

You can of course adapt your language (`locale`) to choose english (`en`) or spanish (`es`) and choose another timezone (`tz`).

Note the “Registration token” this command returns and visit from your browser `https://cozy.domain.example?registerToken=<registration_token>` substituting `domain.example` with your real domain name and `<registration_token>` with the “Registration token” you got.
You will be prompted to define your Cozy password and you will be able to start using your self-hosted Cozy.

To create more instances, refer to the [administration guide](../../administration/more_instances.md)

## Et voilà !

Your Cozy is now fully operational! Its address is `https://cozy.domain.example` (remplace `domain.example` with your own domain name).

You can then start installing connectors from store to automatically gather your data, save your passwords in cozy-pass, store your files in cozy-drive and install cozy-desktop client on your PC to synchronize your Cozy content with a local folder.

Administration section give more details on how to manage your installation.

<div style="text-align: right">
  <a href="../../administration/">Next --&gt;</a>
</div>
