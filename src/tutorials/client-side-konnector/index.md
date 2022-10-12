A client side connector (also know as _CLISK_ ) is a script that imports data from another web service and put those data into your cozy.
Each client-side connector is an independent application, managed by the [Cozy Home](https://github.com/cozy/cozy-home) application.

The specificity with the client-side connectors in comparaison with a _basic konnector_ is that it's not only using requests to obtain the datas but actually interact with the web service targeted by navigating throught the website, clicking and scraping directly into the client, as a user would in a web browser.

To protect your data, each connector runs inside a container in order to sandbox all their interactions with your data.

> ⚠️ For historical reasons, in the Cozy codebase, a cozy connector is named _konnector_, please follow this convention if modifying an existing application

What will you need to start ?

- [Node](https://nodejs.org/en/) (16), follow the link to [nodejs](https://nodejs.org/en/docs/) doc for proper installation. When it's done, you can check your version with `node --version` in your shell.
- [Yarn](https://classic.yarnpkg.com/lang/en/), again follow the [Yarn doc](https://classic.yarnpkg.com/en/docs/getting-started) for proper install. Check the version with `yarn --version` in your shell.
- [Android Studio](https://developer.android.com/studio/), please follow the [official AndroidStudio documentation](https://developer.android.com/studio/install) for proper install.
- [Chromium](https://www.chromium.org/getting-involved/download-chromium/) for the webview inspector, allowing you to inspect the device you are using.
  
  _note: you can access the inspecter by typing `chrome://inspect/#devices` in the url of your chromium window_

In this tutorial you will learn how to:

- [Create the basic structure for your connector](./getting-started.md)
- [Scrape data from the service](./scrape-data.md)
- [Save data to your Cozy](./save-data.md)