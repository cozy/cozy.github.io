# How to write a collector

## Introduction

A collector is a small script that allow to import data from an external website. Each collector is an independent application, managed by the Cozy Collect application.

To protect your data, each collector runs inside a sandbox where all their interactions with your data are under control.

From a technical point of view, collectors are Node.js applications executed inside a container. They communicate with the server using its API, like client side apps, and get an auth token every time they start. They need to register with a manifest, and ask permissions to the user.

To ease the development of a collector, the environment inside the container provides a lot of shared libraries. You don’t need to include this libraries with your script, they will always been available. Here’s a list:

 - [cozy-connector-libs](https://github.com/cozy/cozy-konnector-libs) : collectors specific shared functions ;
 - [cozy-client.js](https://github.com/cozy/cozy-client-js) an abstraction layer to use the Cozy API ;
 - [cheerio](https://cheerio.js.org/) to manipulate the DOM on remote web pages ;
 - [moment](http://momentjs.com/docs/) to manage dates ;
 - [polyglot](http://airbnb.io/polyglot.js/) for localization ;
 - [request](https://github.com/request/request) for fetching remote URLs ;

When the application is started, it also get some data through environment variables:

 - `COZY_CREDENTIALS` : the auth token used by `cozy-client-js` to communicate with the server ;
 - `COZY_URL` : the API entry point ;
 - `COZY_FIELD` : the settings specific to each collector, for example the path of folder where the user wants to store the remote files ;

The application can access a temporary file system, deleted at the end of its execution. Its logs (standard and error output) are kept by the server.


## Let’s create our first collector

The easiest way to create a new collector is to use [our template](https://github.com/cozy/cozy-konnector-template):

```sh
git clone https://github.com/cozy/cozy-konnector-template
cd cozy-konnector-template
yarn # ou npm install
```

_note: the Cozy Team uses `yarn`, but if you prefer `npm`, just keep using it, everything should just work._

Then, write your code into `konnectors.js` and build the application, running `yarn build` or `npm run build`.

### Collector structure

Basically, a collector is just an object with some required fields:

 - `name`: the displayed name of the collector;
 - `slug`: its internal name;
 - `vendorLink`: the URL of the site whose data will be fetched from;
 - `category`: in Cozy Collect, all available modules are arranged in categories. Allowed categories are "energy", "health", "host_provider", "insurance", "isp", "others", "productivity", "shopping", "social", "telecom", and "transport". If no category, or an unknown one, is provided, it will default to "other";
 - [`color`](https://github.com/cozy/cozy-collect/blob/master/docs/connector-configuration.md#color): the background color used when displaying the connector. This is an object with two attributes:
   - `hex`: the hexadecimal definition of the color, for example `#FF0000` for red;
   - `css`: the value of the css property. May be the same as the hex value, or a more complex value, for example a gradient;
 - `models`: an array of models used by the collector. The common library give access to the most used models, `bankOperation`, `bill`, `file`, `folder`, but you can of course also define your owns;
 - `fetchOperations`: array of methods that will be called sequentially to fetch the data;

You can also add other attributes:

 - [`description`](https://github.com/cozy/cozy-collect/blob/master/docs/connector-configuration.md#description): a detailed description of the collector;
 - `fields`: description of additional required settings. They will be displayed to the user when configuring the collector, and passed to the application by the server on start;

To create the collector, just call `baseKonnector.createNew()` from the Cozy Collector lib, with an object describing the collector:

``` javascript
const {baseKonnector, filterExisting, saveDataAndFile, models} = require("cozy-konnector-libs");
const Kitten = models.baseModel.createNew({
  name: "kitten"
});

module.exports = baseKonnector.createNew({
  name: "kitten",
  models: [],
  fetchOperations: [
    fetchKittens,
    customFilterExisting,
    customSaveDataAndFile
  ]
});
```

#### Fetch operations

Every time the collector is run, it will call every method from the `fetchOperations` array. Use this methods to log into the remote site, fetch data and save it.

Each function must use the same signature: `functionName(fields, bills, data, next)` where:

 - `fields` are the values of the optional configuration fields;
 - `entries` is an object to pass data from one function to 
 - `data` allow to pass raw data from one function to the next one;
 - `next` is a function to call to execute next function. One may pass an error as first argument.

Many operations are common to most of the connectors, so we created some common functions you can import from the shared library:

 - `filterExisting` to filter data;
 - `linkBankOperation` to link a bill to a bank operation;
 - `saveDataAndFile` save the data;
 - `updateOrCreate` create or update documents inside database

We’ll have a deeper look at this methods below.


### Konnector lib

The Cozy Konnector Lib provide some useful methods for common tasks:

 - `baseKonnector.createNew()`: create the connector and fetch data;
 - `cozyClient` allow to access methods from the Cozy Client library;
 - `fetcher` is the internal class that run fetching operations in sequence, calling the functions with the right parameters;
 - `log(type, message)` allows to log messages;
 - `manifest` extracts informations from the manifest;
 - `naming` is a method allowing to build file names according to parameters;

#### Common methods

** filterExisting(log, model, suffix, vendor) **

This method returns a function that filter data fetched from the remote site to only keep the ones that don’t exist in database. The fetched data are expected to be in the `entries.fetched` array. The resulting array will be put into `filtered`

Parameters:

 - `log`: unused (kept for retro-compatibility);
 - `model`: the model;
 - `suffix`: unused (kept for retro-compatibility);
 - `vendor`: if a vendor parameter is given, entry should be of given vendor to be added to the hash (useful for bills).

```javascript
konnector.fetchOperations = [ (…), customFilterExisting, (…) ];

function customFilterExisting(requiredFields, entries, data, next) {
  filterExisting(myKonnector.logger, Bill) (requiredFields, entries, data, next);
}
```


** saveDataAndFile(logger, model, options, tags) **

This method returns a function that creates an object in database for each item in `entries.filtered` array. If item has a `pdfurl` attribute, the remote file will be downloaded and stored on the filesystem. `pdfUrl` can point to any file, not necessarily a PDF file. The name comes from legacy code and has not been updated.

Parameters:

 - `log`: unused (kept for retro-compatibility);
 - `model`: the model;
 - `options`:
 - `tags`: array of tags to apply to created files.

** updateOrCreate(logger, model, filter, options)` **

This method return a function that creates or updates an object in database for each item in the `entries[model.displayName]` array. The filter parameters specifies the fields used to find the document inside the database.

Parameters:

 - `log`: unused (kept for retro-compatibility);
 - `model`: the model;
 - `filters`: an array of fields names;
 - `tags`: array of tags to apply to created files.


** linkBankOperation **

This method returns a function that will try to link a bill to a bank operation. For each data item from `entries.fetched`, it will look for an operation that could match this entry. Once found, it attaches a binary to the bank operation. It’s the same binary that is attached to the corresponding file object.

The criteria to find a matching operation are:

 - Operation label should contain one of the identifiers given in parameter;
 - The date should be between (bill date - `dateDelta`) and (bill date + `dateDelta`). Where `dateDelta` is given as a parameter and is in days;
 - The amount should be between (bill amount - `amountDelta`) and (bill amount + `amountDelta`). Where `amountDelta` is given as a parameter.

Parameters:

You should pass parameters as an object whose keys are:

 - `log`: a `printit` logger. See the [printit documentation](https://github.com/cozy/printit#it-began-with-a-consolelog) for details
 - `model`: a model object to check for.
 - `identifier`: a string or an array of strings to look for in the operation label (case insensitive: the layer will automatically set it to lowercase).
 - `dateDelta`: the number of days allowed between the bank operation date and the bill date  (15 by default). 
 - `amountDelta`: the difference between the bank operation amount and the bill amount (useful when the currency is not the same) (0 by default).
 - `isRefund`: boolean telling if the operation is a refund or not. By default, it is `false`. Allows to match only operations with positive amount if set to `true`.



#### Common data models

The library includes the most used data model, so you can just require them if you need them:

 - `bankOperation`
 - `bill`
 - `file`
 - `folder`

The library also provide a `baseModel` class to create your own data model. Each model inherits from the following methods:

 - `all(callback)` fetch all documents;
 - `create(entry, callback)` creates a new document;
 - `updateAttributes(id, changes, callback)` update the attributes of a document.


```javascript
const { models: { baseModel } } = require(’cozy-konnector-libs’)

module.exports = baseModel.createNew({
    displayName: "myModel",
    name: "me.cozy.mymodel"
});
```

### The manifest

Each connector is described by a Manifest. This is a JSON file named `manifest.konnector` at the root of your code folder. It should include the following information:

 - `name`: …
 - `slug`: the internal name of the application;
 - `type`: for now, the only allowed value is `node`. In the future, we may support other types of connectors;
 - `version`: 
 - `source`: git URL of the source code repository;
 - `fields`: @TODO
 - `locales`: @TODO
 - `permissions`: an object describing the permissions the connector requires;
 - `developer`: who are you?
   - `name`: 
   - `url`: 

#### Permissions

TODO See documentation of the manifest of an application


The connector parameters are stored in `io.cozy.accounts` documents, so each connector should get access to this doctype.

#### locales

TODO



## Testing

### Running in standalone mode

To ease the development, you don’t need a running Cozy server to test your code. We provide a standalone mode, that mocks the server. This mode uses a configuration file to define the environment variables that the server will send to your application in production. So, start by copying `data/env_fields.json.template` to `data/env_fields.json` and set the parameters your application requires. Then start it with `yarn standalone` or `npm run standalone`.

In standalone mode, saving a file will put it into the `data` folder at the root of your repository. If you need to query the database, put your mock data into `data/fixture.json`. Also, fetched data will just be outputted to the console instead of being sent to the database.


### TODO


L’exécution d’un connecteur est une tâche (`job`) lancée par un déclencheur (`trigger`). Cf [la documentation](https://cozy.github.io/cozy-docdev-v3/fr/intro#ex%C3%A9cuter-des-t%C3%A2ches-sur-le-serveur).
