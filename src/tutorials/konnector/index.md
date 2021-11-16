A connector (also known as _konnector_) is a script that imports data from another web service and put those data into your cozy.
Each connector is an independent application, managed by the [Cozy Home][] application.

To protect your data, each connector runs inside a container in order to sandbox all their interactions with your data.

> ⚠️ For historical reasons, in the Cozy codebase, a cozy connector is named konnector, please follow this convention if modifying an existing application.

What will you need to start ?

- [Node](https://nodejs.org/en/) (16), follow the link to [nodesjs](https://nodejs.org/en/docs/) doc for proper installation. When it's done, you can check your version with `node --version` in your shell.
- [Yarn](https://yarnpkg.com/), again follow the [Yarn doc](https://yarnpkg.com/getting-started) for proper install. Check the version with `yarn --version` in your shell.

In this tutorial you will learn how to:

- [Create the basic structure for your connector](./getting-started.md)
- [Scrape data from the service](./scrape-data.md)
- [Save data to your Cozy](./save-data.md)
- [Package your connector and send it to the store](./packaging.md)

If you want to go further:

- [Learn how konnectors are run by the Cozy stack](./how-does-it-work.md)
- [Add Two Factor Authentication to your connector](./2fa.md)
- [Developing an OAuth connector](./oauth.md)
- [Use a browser simulation to request the website](./cozy-browser.md)
- [ENV vars injected by the cozy-stack when running a konnector](https://docs.cozy.io/en/cozy-stack/konnectors-workflow/#execute-the-konnector) 

[Cozy Home]: https://github.com/cozy/cozy-home
