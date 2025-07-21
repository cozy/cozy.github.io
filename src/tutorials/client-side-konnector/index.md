A Client-Side Konnector (also known as _CliSK_) is a script that imports data from another web service and put those data into your cozy.
Each connector is an independent application, managed by the [Twake Home][] application.

To protect your data, each connector runs inside a container in order to sandbox all their interactions with your data.

> ⚠️ For historical reasons, in the Twake codebase, a twake connector is named "konnector", please follow this convention if modifying an existing application.

What will you need to start ?

- [Node](https://nodejs.org/en/) (20), follow the link to [nodejs](https://nodejs.org/en/docs/) doc for proper installation. When it's done, you can check your version with `node --version` in your shell.
- [Yarn](https://classic.yarnpkg.com/lang/en/), again follow the [Yarn doc](https://classic.yarnpkg.com/en/docs/getting-started) for proper install. Check the version with `yarn --version` in your shell.

In this tutorial you will learn how to:

- [Install the development environnement](./installation.md)
- [Create your first CliSK](./clisk-creation.md)
- [Understand how cozy-clisk library works](./clisk-lib-doc.md)
- [Troubleshoot common issues with CliSK](./troubleshooting.md)
- [Code with Twake's best practices](./best-practice.md)
- [Contribute to any other existing CliSK](./contributions.md)
- [Join the Twake's community](./community.md)

[Twake Home]: https://github.com/cozy/cozy-home
