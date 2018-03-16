# How to write a connector

## Introduction

A connector is a simple script which imports data from other web services and put it in your cozy.
Each connector is an independant application, managed by the [Cozy Collect]
application.

To protect your data, each connector runs inside a container in order to sandbox all their
interactions with your data.

## How does it work ?

A connector is a NodeJS script. The target node version used to run your connector is the
[current LTS version](https://nodejs.org) (8 at the moment).

Like client side apps, connectors communicate with the [Cozy Stack]
using its API, and get an auth token every time they start. They need to register with a manifest,
and ask permissions to the user.

To ease the development of a connector, a npm package, named [cozy-konnector-libs]
provides some shared libraries which are adapted to be used for a connector :

 - [cheerio](https://cheerio.js.org) to easily request html pages like jQuery
 - [request-promise](https://github.com/request/request-promise): [request](https://github.com/request/request) wrapped in promises
 - [request-debug](https://github.com/request/request-debug) which displays all the requests and
   responses in the standard output. Check "debug" option in [requestFactory](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#requestfactory)

But you may need some other npm packages not integrated in [cozy-konnector-libs] to help you run your connector :

 - [momentjs](http://momentjs.com/docs/) or [date-fns](https://date-fns.org) to manage dates
 - [bluebird](http://bluebirdjs.com) to get enhanced promises

When the connector is started, it also gets some data through environment variables:

 - `COZY_CREDENTIALS` : the auth token used by [cozy-client-js] to communicate with the server
 - `COZY_URL` : the API entry point
 - `COZY_FIELDS` : the settings coming from [Cozy Collect] and filled by the user of the connector (login, password, directory path).

Those variables are used by the BaseKonnector and the cozy-client to configure the connection to
the [Cozy Stack] with the right permissions as defined in your manifest.konnector. These are
simulated in standalone mode so that you don't need a real cozy stack to develop your connector.

[More information](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#basekonnector)

From the server point of view, each connector is a `job` that is run periodically via a `trigger`. [More information](https://cozy.github.io/cozy-stack/jobs.html)

## Let’s create our first connector

The easiest way to create a new connector is to use [cozy-konnector-template](https://github.com/cozy/cozy-konnector-template):

### [cozy-konnector-template] and standalone mode

```sh
git clone https://github.com/cozy/cozy-konnector-template cozy-konnector-monservice
cd cozy-konnector-monservice
yarn # or npm install
```

_note: the Cozy Team uses `yarn`, but if you prefer `npm`, just keep using it, everything should just work._

The connector template is ready with demo code to show you how to scrape a fictional
website: [books.toscrape.com](http://books.toscrape.com), for which you do not need to have
credentials.

As indicated in the README, just run it:

```sh
yarn standalone
```

The first run will create a `konnector-dev-config.json` file which allows you to configure the input
of the connector when running it in the CLI.

```javascript
{
  "COZY_URL": "http://cozy.tools:8080",
  "fields": {}
}
```

`COZY_URL` is for later, but the `fields` attribute will allow you to define credentials to the
target web service, like `login` and `password` as if they would come from a real [Cozy Stack].

This way to run the connector is the *standalone* mode. In this mode, `cozyClient` is stubbed and
all data meant to be saved in a cozy is displayed in the standard output and files are directly
saved in the root directory of the connector. This is useful to first develop your connector
without handling the state of a real [Cozy Stack].

You have more documentation about this in the [CLI section of the documentation](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/cli.md).

### Connector structure

Basically, a connector is just a function passed to the BaseKonnector constructor, and which
eventually returns a promise:

To create the connector, just create a new instance of BaseKonnector with the function as argument

```javascript
const {BaseKonnector} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(fields => {
  // use fields to get user credentials and choices
  console.log(fields, 'fields')
})
```

#### Fetch operations

Every time the connector is run, it will call the function and wait for the resolution of the
returned promise. This function can then log into the remote site, fetch data and save it in the
form of an array of objects with specific attributes expected by the different saving functions
(`saveFiles`, `addData`, `filterData`, `saveBills`).

A basic connector workflow involves:

  - getting data and storing them into a variable. You can get the data by calling an API, scraping the remote website…
  - filtering data to remove the ones already present inside the database using [filterData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#module_filterData)
  - save the filtered data into the database ([addData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#adddata))
  - save the related files using ([saveFiles](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#savefiles))

#### Error handling

If your connector hits an issue fetching or saving the data, it can return an error code by throwing it as an error. The error codes are defined inside the [Cozy Collect] application and will display an explicit error to the user:

  - `LOGIN_FAILED`: the konnector could not login
  - `NOT_EXISTING_DIRECTORY`: the folder specified as folder_to_save does not exist (checked automatically by the BaseKonnector)
  - `UNKNOWN_ERROR`: there was an unexpected error, please take a look at the logs to know what appened
  - `VENDOR_DOWN`: the target web site is down now
  - `USER_ACTION_NEEDED`: The user needs to login to the service to do manual actions (could be Terms Of Service to validate)

You can get the list of error codes in `require('cozy-konnector-libs').errors`

``` javascript
const {BaseKonnector, errors} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(fields => {
    // Here, the following message will be displayed in cozy-collect : "Bad credentials. Check the konnector fields and run the connection again."
    throw new Error(errors.LOGIN_FAILED)
})
```

#### [cozy-konnector-libs]

The Cozy Konnector Libs provide several useful methods for common tasks:

 - [BaseKonnector](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#basekonnector): creates the connector and fetches data
 - [cozyClient](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#cozyclient) gives an instance of [cozy-client-js] already initialized according to `COZY_URL`, and `COZY_CREDENTIALS`
 - [requestFactory](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#requestFactory) a function which returns an instance of request-promise initialized with defaults often used in connector development.
 - [log](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#logtype-message-label-namespace) allows to log messages with different levels
 - [filterData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#filterdata) to filter data
 - [addData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#adddata) to add Data to the cozy
 - [linkBankOperations](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#linkbankoperations) to link a bill to a bank operation
 - [saveBills](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#savebills) which uses filterData, addData, saveFiles and linkBankOperations and which is specific to bills
 - [updateOrCreate](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#updateorcreate) create or update documents inside database

## Linking with a cozy and dev mode

Once your connector is able to gather data from the targeted web service in standalone mode. Now is
the time to put this data in a real cozy. Here comes the dev mode.

But before doing that, your connector needs more setup : a `manifest.konnector` file and
`konnector-dev-config.json`'s `COZY_URL` section.

### The manifest

Each connector is described by a manifest. This is a JSON file named `manifest.konnector` at the root of your code folder. It should include the following minimal information:

```
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

[cozy-konnector-template] already has a manifest which you can customize.

You may add some permissions for your own doctype. [Here](https://cozy.github.io/cozy-stack/konnectors.html) is the detailed list of fields for a
connector manifest file.

You can also get more information on permissions in the official [cozy-stack documentation](https://github.com/cozy/cozy-stack/blob/master/docs/permissions.md)

### konnector-dev-config.json

If you want to put data from your connector to a real cozy, your must define where to find this
cozy, and this must be a cozy for which you have the credentials.

Here comes the `COZY_URL` in konnector-dev-config.json which defines just that.

Then you just have to run:

```sh
yarn dev
```

And for the first run, the CLI will open a tab in your browser asking you to give permissions to the
connector and the connector will save data directly in your cozy. This will validate that your
manifest has the needed permissions on the data you want to save.

this is the *dev* mode

## Integration in cozy-collect for all the users

To run a connector, we do not want the cozy to install all dependencies of the connector each time
it installs it.

To avoid this, the connectors need to be compiled into one file in a dedicated branch of the
repository and the repository needs to be a public git repository. The `package.json` file
from [cozy-konnector-template] gives you the commands to do this : `yarn build` and `yarn
deploy` but the last one needs a more complete setup in `package.json`

Once your public git repository is setup, you just have to declare it.

Cozy will soon have a store for connectors and you will be able to publish connectors yourself. But
at the moment, you need to declare your new connector on the [cozy forum](https://forum.cozy.io).
The cozy team will review your code and handle the addition of it the [Cozy Collect] application.

## FAQ

### How do I scrap a website

Use the request function from [cozy-konnector-libs] with the proper options

Here’s a sample code that will fetch the login page to get the value of the anti-CSRF token, submit the login form, browse to the bills page and fetch a bill:

```javascript
const {BaseKonnector, requestFactory} = require('cozy-konnector-libs')
const rq = requestFactory({
  jar: true, // handle the cookies like a browser
  json: false, // do not try to parse the result as a json document
  cheerio: true // automatically parse the result with [cheerio](https://github.com/cheeriojs/cheerio)
})
const moment = require('moment')

module.exports = new BaseKonnector(function fetch (fields) {
  return rq("https://login.remote.web")
  .then($ => { // the result is automatically wrapped with cheerio and you can use it like jQuery
    const form = {
      form: {
        login: fields.login,
        password: fields.password,
        csrf_token: $('[name="csrf_token"]').val(),
      }
    }
    return rq({
      method: 'POST',
      form
    })
  })
  .then($ => rq("https://admin.remote.web/bills"))
  .then($ => {
    return [{date: moment($("#bill_date")), value: $("#bill_value")}]
  })
  .then(entries => addData(entries, 'io.cozy.bills'))
})
```

[Cozy Collect]: https://github.com/cozy/cozy-collect
[Cozy Stack]: https://cozy.github.io/cozy-stack/
[cozy-konnector-libs]: https://github.com/cozy/cozy-konnector-libs
[cozy-client-js]: https://cozy.github.io/cozy-client-js/
[cozy-konnector-template]: https://github.com/cozy/cozy-konnector-template
