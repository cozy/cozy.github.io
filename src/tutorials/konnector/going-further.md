## Going further

### Connector structure

Basically, a connector is just a function passed to the `BaseKonnector` constructor, and which
eventually returns a promise:

To create the connector, just create a new instance of `BaseKonnector` with a function as argument:

```js
const {BaseKonnector} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(fields => {
  // use fields to get user credentials and choices
  console.log(fields, 'fields')
})
```

#### Typical workflow

Everytime the connector is run, it will call the function and wait for the resolution of the returned promise.
This function can then:

- log into the target website,
- fetch data,
- and save them as an array of objects with specific attributes expected by the save function (`saveFiles`, `addData`, `hydrateAndFilter`, `saveBills`).

A basic connector workflow involves:

1. authenticate on the website or API. Might be tricky, but that's the fun :-)
2. getting data from the online service. You can get the data by calling an API or scraping the webpage. Check if the webpage itself is not using an API to retrieve data, might speed up our job. Mobile phones applications usually connects to an API that might be a reliable source of data.
   </br>A quick [exemple of a scraper here](#How-do-I-scrape-my-data-from-a-website).
3. filtering data to remove the ones already present inside the database using [hydrateAndFilter](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_hydrateAndFilter)
4. save the filtered data into the database ([addData](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#adddata))
5. save the related files using ([saveFiles](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#savefiles))

#### Error handling

If your connector hits an issue fetching or saving the data, it can return an error code by throwing it as an error. The error codes are defined inside the [Cozy Home][] application and will display an explicit error to the user:

- `LOGIN_FAILED`: the connector could not login
- `NOT_EXISTING_DIRECTORY`: the folder specified as folder_to_save does not exist (checked automatically by the BaseKonnector)
- `UNKNOWN_ERROR`: there was an unexpected error, please take a look at the logs to know what happened
- `VENDOR_DOWN`: the target web site is down now
- `USER_ACTION_NEEDED`: The user needs to login to the service to do manual actions (could be Terms Of Service to validate)

You can get the list of error codes in `require('cozy-konnector-libs').errors` ([source](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/src/helpers/errors.js))

```js
const {BaseKonnector, errors} = require('cozy-konnector-libs')

module.exports = new BaseKonnector(fields => {
    // Here, the following message will be displayed in cozy-home : "Bad credentials. Check the konnector fields and run the connection again."
    throw new Error(errors.LOGIN_FAILED)
})
```

### I want to pass secret variables to my connector without hardcoding it in the source code

**COZY_PARAMETERS** environment variable will help you.

In standalone mode or dev mode, you can init it in konnector-dev-config.json :

```json
  "COZY_PARAMETERS": {
    "secret": {
      "mySecretKey": "s3cr3tk3y"
    }
  }
```

In your connector, you will get these secrets as a second parameter in your main function.

```js
module.exports = new BaseKonnector(start)

async function start(fields, cozyParameters) {
  log('info', cozyParameters.secret.mySecretKey)
}
// -> "s3cr3tk3y"
```

If you want to know how this works in a real cozy, you can find more information on [Stack documentation](https://docs.cozy.io/en/cozy-stack/konnectors-workflow/#secrets-that-are-not-oauth)

#### [cozy-konnector-libs][]

The Cozy Konnector Libs provide several useful methods for common tasks:

- [BaseKonnector](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#basekonnector): creates the connector and fetches from the stack the connector's parameters (COZY_FIELDS...)
- [cozyClient](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#cozyclient) gives an instance of [cozy-client-js][] already initialized according to `COZY_URL`, and `COZY_CREDENTIALS`. Your code can immediately interact with the server thanks to this client.
- [requestFactory](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_requestFactory) a function which returns an instance of request-promise initialized with defaults often used in connector development.
- [log](https://github.com/cozy/cozy-konnector-libs/blob/3cad316bac1898ef3c2656577af786f6549b40b0/packages/cozy-logger/src/index.js#L35-L41) allows to log messages with different levels
- [hydrateAndFilter](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#hydrateAndFilter) to filter data
- [addData](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#adddata) to store the retrieved data into the cozy
- [linkBankOperations](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#linkbankoperations) to link a bill to a bank operation
- [saveBills](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#savebills) which uses hydrateAndFilter, addData, saveFiles and linkBankOperations and which is specific to bills
- [updateOrCreate](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/api.md#updateorcreate) create or update documents inside database
- [htmlToPDF](<>) to convert HTML code to PDF content to insert into a PDF file created with the `createCozyPDFDocument` function
- [createCozyPDFDocument](<>) to create a new PDF file to pass to `htmlToPDF`

[Cozy Home]: https://github.com/cozy/cozy-home

[cozy-konnector-libs]: https://github.com/konnectors/libs

[cozy-client-js]: https://github.com/cozy/cozy-client-js
