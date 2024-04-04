A client-side konnector (also know as _CLISK_ ) is a script that imports data from another web service and put those data into your cozy.
Each client-side konnector is an independent application, managed by the [Cozy Home](https://github.com/cozy/cozy-home) application.

The specificity with the client-side konnectors in comparaison with a _server-side konnector_ is that it's not only using requests to obtain the data, but it actually interacts with the targeted web service by navigating throught the website, clicking and scraping directly into the client, as a user would do in a web browser.

To protect your data, each konnector runs inside a container in order to sandbox all their interactions.

What will you need to start ?

- [Node](https://nodejs.org/en/) (20), follow the link to [nodejs](https://nodejs.org/en/docs/) doc for proper installation. When it's done, you can check your version with `node --version` in your shell.
- [Yarn](https://classic.yarnpkg.com/lang/en/), again follow the [Yarn doc](https://classic.yarnpkg.com/en/docs/getting-started) for proper install. Check the version with `yarn --version` in your shell.
- [Android Studio](https://developer.android.com/studio/), please follow the [official AndroidStudio documentation](https://developer.android.com/studio/install) for proper install.
- [Chromium](https://www.chromium.org/getting-involved/download-chromium/) for the webview inspector, allowing you to inspect the device you are using.
  
  _note: you can access the inspecter by typing `chrome://inspect/#devices` in the url of your chromium window_

In this tutorial you will learn how to:

- [Create the basic structure for your konnector](./getting-started.md)
- [Scrape and save data from the service](./scrape-data.md)
