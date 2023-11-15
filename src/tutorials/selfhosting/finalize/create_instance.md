# Create your first cozy instance

## Create your First Cozy instance

First define some variable you will need to configure your instance:

- The `DOMAIN` variable should contain your domain name, the one under which all cozy instances will be created
- The `EMAIL` variable should contain your email address (it will be used as a parameter of your cozy instance)

```
DOMAIN=domain.example
EMAIL=your.email@email.domain
```

Then create the instance (you can of course adapt your language (`locale`) to choose english (`en`) or spanish (`es`) and choose another timezone (`tz`)).

    sudo cozy-stack instances add \
                    --apps home,banks,contacts,drive,notes,passwords,photos,settings,store \
                    --email "${EMAIL}" \
                    --locale fr \
                    --tz "Europe/Paris" \
                    cozy.${DOMAIN}

!!! warning

    Instance creation can take up to 30 seconds without printing anything on screen.
    Please wait during creation and avoid stopping it in the middle or your instance will miss some important bits.

    In case something goes wrong, you can remove the instance with the following command before trying again

        sudo COZY_ADMIN_PASSWORD="${COZY_PASS}" cozy-stack instances rm --force cozy.${DOMAIN}

Note the “Registration token” this command returns and visit from your browser `https://cozy.domain.example?registerToken=<registration_token>` substituting `domain.example` with your real domain name and `<registration_token>` with the “Registration token” you got.
You will be prompted to define your Cozy password and you will be able to start using your self-hosted Cozy.

To create more instances, refer to the [corresponding chapter of the administration guide](../administration/more_instances.md)

## Et voilà !

Your Cozy is now fully operational! Its address is `https://cozy.domain.example` (remplace `domain.example` with your own domain name).

You will find some [quick start guides on our online support site](https://help.cozy.io/tag/quick-start/).

You can then start installing connectors from store to automatically gather your data, save your passwords in cozy-pass, store your files in cozy-drive and install cozy-desktop client on your PC to synchronize your Cozy content with a local folder.

[Administration section](../administration/index.md) give more details on how to manage your installation.

<div style="text-align: right">
  <a href="../../administration/">Next --&gt;</a>
</div>
