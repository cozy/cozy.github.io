---
title: Scrape data
---

In this part, we are going to see how to scrape data from the service you want to retrieve your data from. If not done yet, you want to check the [getting started guide](./getting-started.md). 

### Implement your connector

There are four steps for a connector to save data to [Cozy Stack][]:

1. authentication
2. request data
3. parse and format data
4. save data to cozy stack

You can see these steps in the `src/index.js` in the [konnectors/template](https://github.com/konnectors/cozy-konnector-template/blob/master/src/index.js):

```javascript
async function start(fields) {
  // step 1.
  log('info', 'Authenticating ...')
  await authenticate(fields.login, fields.password)
  log('info', 'Successfully logged in')

  // step 2.
  // The BaseKonnector instance expects a Promise as return of the function
  log('info', 'Fetching the list of documents')
  const $ = await request(`${baseUrl}/index.html`)

  // step 3.
  log('info', 'Parsing list of documents')
  const documents = await parseDocuments($)

  // step 4.
  // here we use the saveBills function even if what we fetch are not bills, but this is the most
  // common case in connectors
  log('info', 'Saving data to Cozy')
  await saveBills(documents, fields.folderPath, {
    // this is a bank identifier which will be used to link bills to bank operations. These
    // identifiers should be at least a word found in the title of a bank operation related to this
    // bill. It is not case sensitive.
    identifiers: ['books']
  })
}
```

#### Authentication

Open the `src/index.js` file, there are comments to guide you through it.
The very first step is to be able to authenticate to the remote service, this is done with the line:

_note: don't forget to add your additional fields if you have some._

```js
await authenticate(fields.login, fields.password)
```

There are many obstacles at this level:

- is there a captcha?
- is there a 2FA?
- how is the `<form>`?

_note: if the remote service exposes an API, you should use classical [request](https://github.com/request/request-promise) call._

Let's say the remote service exposes a simple classical form like <https://www.trainline.eu/signin>:

```html
<form id="signin-form" novalidate="" class="signin__form" data-ember-action="" data-ember-action-680="680">

  <input name="email" autocomplete="on" placeholder="Email Address" id="ember691" class="ember-text-field textfield ember-view"
    data-enpass.usermodified="yes" type="email">

  <input name="password" autocomplete="on" placeholder="Password" id="ember696" class="ember-text-field textfield ember-view"
    data-enpass.usermodified="yes" type="password">

  <div class="signin__forgot">
    <span data-ember-action="" data-ember-action-697="697">
      <a href="/password" id="ember698" class="ember-view"> Forgot your password?
      </a>
    </span>
  </div>

  <div class="signin__buttons ">

    <div class="signin__buttons-block">
      <button type="submit" class="signin__button">
        Sign In
      </button>
    </div>
  </div>

</form>
```

Find a CSS selector for the form tag: `form#signin-form`.
Find the `name` of the input tags used to host user's credentials: `email` and `password`.

You are ready to complete the `signin(options)` object called in the `authenticate(username, password)` function:

```js
function authenticate(username, password) {
  return signin({
    url: `https://www.trainline.eu/signin`,
    formSelector: 'form#signin-form',
    formData: { email: username, password },
    validate: (statusCode, $) => {
      // write some code to validate the form submission
    }
  })
}
```

To implement the `validate` function, you need to check what is happening on a successful login and on an unsuccessful login.
With the <https://www.trainline.eu/signin> example, fill the form with wrong credentials, open your browser's devtools (and check the network tab) and submit the form.
Here it is clear, on incorrect credentials, the response have a status code `422`:

```http
HTTP/2.0 422 No Reason Phrase
```

Do the same with valid credentials.

```http
HTTP/2.0 200 OK
```

Then you can write a simple and straight forward `validate` code:

```js
function authenticate(username, password) {
  return signin({
    url: `https://www.trainline.eu/signin`,
    formSelector: 'form#signin-form',
    formData: { email: username, password },  // "email" and "password" correspond to the `name` attribute of the HTML inputs
    validate: (statusCode, $) => {
      return statusCode === 200 || log('error', 'Invalid credentials')
    }
  })
}
```

However if the target website doesn't use `statusCode` correctly you can also use `fullResponse.request.uri.href` to check if there is a redirection to a page that requires to be logged in:

```js
validate: (statusCode, $, fullResponse) => {
  return fullResponse.request.uri.href == 'https://example.com/account' || log('error', 'Invalid credentials')
}
```

It is also possible to use Cheerio to check if an HTML element is present in the web page or not :

```js
validate: (statusCode, $) => {
  return $('a[href="https://example.com/logout"]').length == 1 || log('error', $('.error').text())
}
```

#### Request data

Once the connector is able to be authenticated by the online service, the next step is to fetch data.
The most common case is that the invoices we want to fetch are listed in a HTML page.
So to request data, we fetch the target webpage that contains invoices list.

But sometimes, the webpage is a JavaScript page that uses a JSON API URL.
JSON is easier to parse than full HTML webpages.

For the purpose of this guide, let's consider we are in the case of a full HTML webpage, like the service given as an example in the template: <http://books.toscrape.com>

This is the easiest part, just fetch the webpage:

```js
const $ = await request('http://books.toscrape.com/index.html')
```

The `$` variable is set to a [cheerio](https://cheerio.js.org/) object with [useful API to crawl the webpage](https://github.com/request/request-promise#crawl-a-webpage-better).

You can name this variable as you want and create as many as you want Cheerio variables such as : `$doc` or `$page`.

That object will be very useful for the next step.

#### Parse the document

We want to get every `<article />` of the page in a JavaScript Array:

```js
const articles = [].map.call($('article', node => node))
```

For every book, we want to catch the title attribute of this tag `article h3 a`.
This is a [CSS Selector](https://developer.mozilla.org/en-US/docs/Web/API/Document_object_model/Locating_DOM_elements_using_selectors) that [cheerio](https://cheerio.js.org/) understands to select some part of the tree.

In order to crawl a list of items to create an Array of JSON object, we can create our own function or use the function [scrape from the connector libs](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#scrape):

```js
const docs = scrape(
  $,
  {
    title: {
      sel: 'h3 a',
      attr: 'title'
    },
    amount: {
      sel: '.price_color',
      parse: normalizePrice
    },
    url: {
      sel: 'h3 a',
      attr: 'href',
      parse: url => `${baseUrl}/${url}`
    },
    fileurl: {
      sel: 'img',
      attr: 'src',
      parse: src => `${baseUrl}/${src}`
    },
    filename: {
      sel: 'h3 a',
      attr: 'title',
      parse: title => `${title}.jpg`
    }
  },
  'article'
)
```

> Keep in mind that there are many useful CSS [Pseudo-classes](https://developer.mozilla.org/en-US/docs/Learn/CSS/Introduction_to_CSS/Pseudo-classes_and_pseudo-elements) and [Combinators](https://developer.mozilla.org/en-US/docs/Learn/CSS/Introduction_to_CSS/Combinators_and_multiple_selectors)  that you can use in your CSS selectors to help you select HTML elements.

This code will loop on `<article />` and for each item will create a JSON object with the selector `sel` and the value of attribute `attr` if specified, otherwise it takes the value of the child node, this value can be edited with the `parse` function.
Here is a sample for the following markup from <http://books.toscrape.com>:

```html
<article class="product_pod">
  <div class="image_container">
    <a href="catalogue/a-light-in-the-attic_1000/index.html">
      <img src="media/cache/2c/da/2cdad67c44b002e7ead0cc35693c0e8b.jpg" alt="A Light in the Attic" class="thumbnail">
    </a>
  </div>
  <p class="star-rating Three">
    <i class="icon-star"></i>
    <i class="icon-star"></i>
    <i class="icon-star"></i>
    <i class="icon-star"></i>
    <i class="icon-star"></i>
  </p>
  <h3>
    <a href="catalogue/a-light-in-the-attic_1000/index.html" title="A Light in the Attic">A Light in the ...</a>
  </h3>
  <div class="product_price">
    <p class="price_color">£51.77</p>
    <p class="instock availability">
      <i class="icon-ok"></i>
      In stock
    </p>
    <form>
      <button type="submit" class="btn btn-primary btn-block" data-loading-text="Adding...">Add to basket</button>
    </form>
  </div>
</article>
```

And we will get the following JSON object:

```json
{
  "title": "A Light in the Attic",
  "amount": 51.77,
  "url": "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "fileurl": "http://books.toscrape.com/media/cache/2c/da/2cdad67c44b002e7ead0cc35693c0e8b.jpg",
  "filename": "A Light in the Attic.jpg"
}
```

The code sample includes some other function to manipulate the result object, but we have the idea.
Once we build a correct object, we can save it to Cozy Stack.

`fileurl` is used to tell Cozy where to find the file (here an image) to retreive. Then you can save it to Cozy Stack (see section below).

There are many [document types](https://github.com/cozy/cozy-doctypes) (Doctypes) you can store in your Cozy, such as:

- [Bills](https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bills/)
- [Contacts](https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.contacts/)
- [Bank](https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bank/)
- and so on…

#### Save data to Cozy Stack

In the example we use some built-in function to save a bill to the Cozy Stack.
But there is a bunch of functions available depending on what you want:

- [`addData`](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#adddata)
- [`hydrateAndFilter`](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_hydrateAndFilter)
- [`saveBills`](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_saveBills) to save invoices files (this function use `saveFiles`) that can be linked to your bank transactions.
- [`saveFiles`](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_saveFiles) to upload files to Cozy Drive.
- and so on…

For example, to save bills to Cozy you have to start by recovering all required fields for a data type [io.cozy.bills](https://docs.cozy.io/en/cozy-doctypes/docs/io.cozy.bills/) using the `scrape` function, and then you can use the function `saveBills` to save your docs to Cozy Stack as shown below:

```dart
await saveBills(documents, fields, {
  idenditifiers: ['vendor'], // name of the target website
  contentType: 'application/pdf'
})
```

_`documents` is the list of bills returned by the function `parseDocuments` after the page scraping_.

We can find more information in the [libs repository](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md).

**Now that we pass on every steps, it is time to test the connector with `yarn standalone`.** For now, we have not inserted the data in the Cozy, in the next section , you will learn how to plug your connector to your Cozy.

[Cozy Stack]: https://docs.cozy.io/en/cozy-stack/
