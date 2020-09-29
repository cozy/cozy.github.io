---
title: Save data
---

In the previous sections, we have

- [Created the boilerplate for our connector](./getting-started.md)
- [Scraped data from our Cozy](./scrape-data.md)

We haven't yet inserted the data in our Cozy since we have used the `standalone` mode. Here it comes ;)

<!-- MarkdownTOC autolink=true -->

- [Linking your connector to a cozy : `dev mode`](#linking-your-connector-to-a-cozy--dev-mode)
  - [The manifest](#the-manifest)
  - [konnector-dev-config.json](#konnector-dev-configjson)
  - [Run the dev mode](#run-the-dev-mode)

<!-- /MarkdownTOC -->

## Linking your connector to a cozy : `dev mode`

After several `yarn standalone`, your connector is able to automatically gather data from the targeted web service. </br>It's time now to put this data in a real cozy. </br>Here comes the _dev mode_.

For that your connector needs more setup :

- a `manifest.konnector` file
- a `COZY_URL` section in `konnector-dev-config.json`

### The manifest

Each connector is described by a manifest. This is a JSON file named `manifest.konnector` at the root of your code folder. It should include the following minimal information:

```json
{
  "name": "konnector name",
  "type": "node",
  "slug": "konnectorslug",
  "description": "description",
  "source": "git://github.com/cozy/cozy-konnector-thename.git",
  "permissions": {
    "accounts": {
      "description": "Required to get the account's data",
      "type": "io.cozy.accounts",
      "verbs": ["GET"]
    }
  }
}
```

[cozy-konnector-template][] already has a manifest which you can customize.

You may add some [permissions](https://docs.cozy.io/en/cozy-stack/permissions/) for your own doctype. [Here](https://docs.cozy.io/en/cozy-stack/konnectors/#the-manifest) is the detailed list of fields for a
connector manifest file.

### konnector-dev-config.json

If you want to put data from your connector to a real cozy, you must define where to find this cozy, and this must be a cozy for which you have the credentials.

Here is an example `konnector-dev-config.json`:

```
{
  "COZY_URL": "https://lukeskywalker.mycozy.cloud",
  "fields": {
    "login": "luke@skywalker.org",
    "password": "daddyissues"
  }
}
```

⚠️ It's a common mistake to put a URL with the app, for example `https://lukeskywalker-home.mycozy.cloud`. It won't work, you must removed the `-home` part.

### Run the dev mode

Then you just have to run:

```sh
yarn dev
```

For the first run, the CLI will open a tab in your browser asking you to grant permissions to the
connector. The connector will then save data directly into your cozy. This will validate that your
manifest has the needed permissions on the data you want to save.

Now that we have successfully scraped and saved our data, the next step is to [build the connector and send it to Cozy store](./packaging.md) !

[cozy-konnector-template]: https://github.com/konnectors/cozy-konnector-template
