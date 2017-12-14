# How to write a connector

## Introduction

**New! Want an interactive tutorial on how to create a connector? Try [this one](https://tech.io/playgrounds/1482/cozy-connector-tutorial):**

A connector is a small script that allows to import data from an external website. Each connector is an independent application, managed by the Cozy Collect application.

To protect your data, each connector runs inside a sandbox where all their interactions with your data are under control.

From a technical point of view, connectors are Node.js applications executed inside a container. They communicate with the server using its API, like client side apps, and get an auth token every time they start. They need to register with a manifest, and ask permissions to the user.

To ease the development of a connector, an npm package, named [cozy-connector-libs](https://github.com/cozy/cozy-konnector-libs) provides a lot of
shared libraries. But you may need some other npm packages to help you running your connector: 

 - [moment](http://momentjs.com/docs/) to manage dates 

When the application is started, it also gets some data through environment variables:

 - `COZY_CREDENTIALS` : the auth token used by `cozy-client-js` to communicate with the server 
 - `COZY_URL` : the API entry point 
 - `COZY_FIELD` : the settings specific to each connector, for example the path of folder where the user wants to store the remote files 

But the base connector (`require('cozy-konnector-libs').BaseKonnector`) in cozy-konnector-libs handles these for you.

The application can access a temporary file system, deleted at the end of its execution. Its logs (standard and error output) are kept by the server.

From the server point of view, each connector is a `job` run through a `trigger`.

## Let’s create our first connector

The easiest way to create a new connector is to use [our template](https://github.com/cozy/cozy-konnector-template):

```sh
git clone https://github.com/cozy/cozy-konnector-template
cd cozy-konnector-template
yarn # or npm install
```

_note: the Cozy Team uses `yarn`, but if you prefer `npm`, just keep using it, everything should just work._

Then, write your code into `index.js` and build the application, running `yarn build` or `npm run build`.

### Collector structure

Basically, a connector is just a function passed to the BaseKonnector constructor, and which
returns a promise:

To create the connector, juste create a new instance of BaseKonnector with the function as argument

``` javascript
const {BaseKonnector, saveFiles, request} = require('cozy-konnector-libs')

const rq = request()

module.exports = new BaseKonnector(fields => {
  return rq({
    uri: 'https://api.qwant.com/api/search/images',
    qs: {
      q: 'chatons',
      count: 10
    }
  })
  .then(body => {
    let result = []
    if (body && body.data && body.data.result && body.data.result.items) {
      result = body.data.result.items.map(item => ({fileurl: item.media}))
    }
    return result
  })
  .then(entries => saveFiles(entries, fields))
})

#### Fetch operations

Every time the connector is run, it will call the function and wait for the resolution of the
return promise. This function can then log into the remote site, fetch data and save it.

A basic connector workflow involves:
 - getting data and storing them into a variable.  You can get the data by calling an API, scraping the remote website…
 - filtering data to remove the ones already present inside the database using [filterData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#module_filterData)
 - save the filtered data into the database ([addData](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#adddata))
 - save the related files using ([saveFiles](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#savefiles))

We’ll have a deeper look at this methods below.


#### Error handling

If your connector hit some issue fetching or saving the data, it can return an error code by throwing it as an error. Some error code are defined inside the Cozy Collect application and will display an explicit error to the user:

  - `LOGIN_FAILED`: the konnector could not login
  - `NOT_EXISTING_DIRECTORY`: the folder specified as folder_to_save does not exist (checked by base_konnector)
  - `UNKNOWN_ERROR`: there was an unexpected error, please take a look at the logs to know what appened
  - `VENDOR_DOWN`: there was an unexpected error, please take a look at the logs to know what appened
  - `USER_ACTION_NEEDED`: The user needs to login to the service to do manual actions (could be Termes Of Service to validate)

### Konnector lib

The Cozy Konnector Lib provide some useful methods for common tasks:

 - `BaseKonnector`: create the connector and fetch data
 - `cozyClient` gives an instance of cozy-client-js already initialized according to COZY_URL, and
   COZY_CREDENTIALS
 - `[request](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#request)` a function which returns an instance of request-promise initialized with defaults
   often used in connector development.
 - `log(type, message)` allows to log messages
 - `manifest` extracts informations from the manifest (mainly used internaly at the moment)
 - `filterData` to filter data
 - `addData` to add Data to the cozy
 - `linkBankOperations` to link a bill to a bank operation
 - `saveBills` which uses filterData, addData, saveFiles and linkBankOperations and which is
   specific to bills
 - `updateOrCreate` create or update documents inside database

#### Common methods

** cozyClient() **

If you want to access cozy-client-js directly, this method gives you directly an instance of it,
initialized according to COZY_URL and COZY_CREDENTIALS environment variable.
You can refer to the [cozy-client-js documentation](https://cozy.github.io/cozy-client-js/) for more information.

```javascript
const {clientClient} = require('cozy-konnector-libs')

cozyClient.data.defineIndex('my.doctype', ['_id'])
```

** filterData **

This function filters the passed array from data already present in the cozy
Parameters:

 - `entries`: an array of objects corresponding to the data you want to save to the cozy
 - `doctype`: the doctype where you want to save data (ex: 'io.cozy.bills')
 - `options`:
    * `index`: this is return value which returned by cozy.data.defineIndex, the default will correspond to all document of the selected doctype
    * `selector` : this the mango request : default one will be {selector: {_id: {"$gt": null}}} to get all the records
    * `keys` : this is the list of keys used to check that two items are the same

```javascript
const data = [
  {
    name: 'toto',
    height: 1.8
  },
  {
    name: 'titi',
    height: 1.7
  }
]

return filterData(data, 'io.cozy.height', {
  keys: ['name']
}).then(filteredData => addData(filteredData, 'io.cozy.height'))

** addData **

This function save the data into the cozy

Parameters:

 - `entries`: an array of objects corresponding to the data you want to save to the cozy
 - `doctype`: the doctype where you want to save data (ex: 'io.cozy.bills')

** saveFiles **

The goal of this function is to save the given files in the given folder via the Cozy API.

 - `entries`: an array of objects where the function will look for fileurl and filename attributes
 - `fields`: the object passed to the fetch function which contains the folderPath attributes which
 - `options`: options to influence the behavior of the saveFiles function. See the [detailed
   documentation](https://github.com/cozy/cozy-konnector-libs/blob/master/docs/api.md#savefiles)
   for more information about it

** updateOrCreate` **

The goal of this function is create or update the given entries according to if they already exist
in the cozy or not

Parameters:

 * - `entries` is an array of objects with any attributes :
 *
 * - `doctype` (string) is the cozy doctype where the entries should be saved
 *
 * - `filters` (array) is the list of attributes in each entry should be used to check if an entry
 *   is already saved in the cozy

### The manifest

Each connector is described by a Manifest. This is a JSON file named `manifest.konnector` at the root of your code folder. It should include the following information:

 - `name`: …
 - `slug`: the internal name of the application
 - `type`: for now, the only allowed value is `node`. In the future, we may support other types of connectors
 - `version`: 
 - `source`: git URL of the source code repository
 - `fields`: @TODO
 - `locales`: @TODO
 - `permissions`: an object describing the permissions the connector requires
 - `developer`: who are you?
   - `name`: 
   - `url`: 

#### Permissions

TODO See documentation of the manifest of an application

The connector parameters are stored in `io.cozy.accounts` documents, so each connector should get access to this doctype.


## FAQ

### How do I scrap a website

Use the request function from cozy-konnector-libs with the proper options

Here’s a sample code that will fetch the login page to get the value of the anti-CSRF token, submit the login form, browse to the bills page and fetch a bill:

```javascript
const {BaseKonnector, request} = require('cozy-konnector-libs')
const rq = request({
  jar: true, // handle the cookies like a browser
  json: false, // do not try to parse the result as a json document
  cheerio: true // automatically parse the result with [cheerio](https://github.com/cheeriojs/cheerio)
})
const moment = require('moment')

module.exports = new BaseKonnector(function fetch (fields) {
  return rq("https://login.remote.web")
  .then($ => { // the result is automaticall wrapped with cheerio and you can use it like jQuery
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

## Testing

### Running in standalone mode

To ease the development, you don’t need a running Cozy server to test your code. We provide a standalone mode, that mocks the server. This mode uses a configuration file to define the environment variables that the server will send to your application in production. So, start by running `yarn standalone`, a konnector-dev-config.json file will be created and set the parameters your application requires. Then start it with `yarn standalone` or `npm run standalone`.

In standalone mode, saving a file will put it at the root of your repository. If you need to query the database, put your mock data into `fixture.json`. Also, fetched data will just be outputted to the console instead of being sent to the database.


