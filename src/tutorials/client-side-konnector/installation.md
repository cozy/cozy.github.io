# Installation

Here you will find the instruction to setup the development environnement of a Client-Side Konnector

### Prerequisites

To be able to make your first CliSK you will need on your machine :

- A [cozy-stack](https://github.com/cozy/cozy-stack) , installed following the documentation
- The [Twake App](https://github.com/cozy/cozy-flagship-app/) repo ready
- An emulator or an external device - To run the Twake App
- Chromium - To access the inspecting tool for your device on `chrome://inspect/#devices`
- NodeJS 20 (or above)
- Yarn 1 (or above)
- Git

### Detailed instance's setup instructions

Here you will be guided step by step to create a local instance and get it ready to develop your first CliSK

##### Create a local instance

Once everything is ready, you will need to create an instance to work on. To do so the cozy-stack must be running.
If you follow the [cozy-stack doc](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md), you should have already made a first instance verifying it's all good. But while we want to create a CliSK, we need an instance using [`nip.io`](https://nip.io/) (no specific set up required for this) to ensure it is accessible on your local network, especially recommended because an external device _or an emulated one_ is needed to develop a CliSK. Here's a command line to create an instance using `nip.io` easily :

```bash
cozy-stack instances add [INSTANCE-NAME].[YOUR-LOCAL-IP].nip.io:8080 --passphrase [YOUR-PASSPHRASE] --apps home,store,drive,photos,settings,contacts,notes,passwords --email [YOUR-MAIL] --locale fr --public-name DevCCC --context-name dev
```

There is nothing specific to do before using `nip.io` so you can simply run the command line above.

---

##### Connect to your local instance

With that done you can connect to it on your browser just to check everything went well.

Now open a terminal on the Twake App repo and connect your device to the PC if you are using an external one.

For you to connect on your instance via your emulated device or external device, you will need a MailHog server up and running to get the verification code, but you should have installed it when you followed the [cozy-stack doc](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md) for the Twake App, so start the server in another terminal with :

```bash
MailHog
```

Once the server is up, you can go to `http://cozy.tools:8025/` on your browser.

In the Twake App repo start the native server :

```bash
# Download Dependencies
$ yarn

# Run native server
$ yarn start # (must be started for the following commands)
```

In a second tab still on the Twake App, launch on device :

```bash
# Run on Android Device
$ yarn android

# Run on iOS Device
$ cd ios && pod install # Only the first time
$ yarn ios
```

If all went well, the app will open on your device asking you to connect to your instance. _Make sure MailHog is running_ and follow these steps :

- Click on the `I ALREADY HAVE A PERSONAL CLOUD` button
- Click on `CONNECT TO MY PERSONAL CLOUD FROM ITS URL`
- Click on the list and select `Other domain`
- Paste your instance name => ex. `devccc.[YOUR-LOCAL-IP].nip.io:8080`
- Fill your passphrase
- Check MailHog interface on your browser to retrieve the code and paste it in the app
- Add an unlock PIN if you want, it is not mandatory

And now you should be good to go, so let's add a feature flag to make the development and debug easier.

##### Add dev flags on your instance

To be able to see the webview during the execution of a CliSK, you will need to enable the feature with :

```bash
cozy-stack features flags '{"clisk.always-show-worker": true}' --domain [INSTANCE-NAME].[YOUR-LOCAL-IP].nip.io:8080
```

⚠️ _You may have to restart the Twake App for the flag to be updated_

If you want to test your konnector having the "user experience" (no visible webview during execution) just set the value of the flag to `false` .

### Troubleshooting common issues

##### Cozy Application logs

To troubleshoot some issues you may have, you can check the logs into the terminal tab where Metro is running (the one where you used the `yarn start` command).

##### Chrome/Chromium inspector

To access both of the webviews, you will need to use the chrome inspector and open the wanted webview. It will usually be the `worker`'s webview but know you can access the `pilot`'s from here too. Both are accessible from `chrome://inspect/#devices`.
