For some websites, a lot of computation is needed to have a correct authentication and this
computation is done in javascript. It is possible to do some reverse engineering but there is
another solution: running a browser simulation in your connector.

## Zombie

We chose a specific js browser implementation which is [zombie](https://github.com/assaf/zombie).
It is a wrapper around jsdom to make it easier for scraping.

## Initialisation

Just add the zombie npm package to your connector using :

```
yarn add zombie
```

And use our wrapper with proper defaults for connectors :

```js
const Browser = require('cozy-konnector-libs/dist/CozyBrowser')
const browser = new Browser()
```

Then you can use the zombie api to run http requests to the targetted website.

`browser` will keep its own cookie session.

There is an implementation of the template of connector using the Cozy Browser available :
https://github.com/konnectors/cozy-konnector-template/tree/feat/zombiejs

## What if I want to use the browser session for saveFiles ?

`browser` has two handy methods to help you with cookie session :
  * `getCookieJar` : can export the current cookie session in a cookie jar object
  * `loadCookieJar` : can import a cookie jar object as the new cookie session of the browser


```js
  const { requestFactory } = require('cozy-konnector-libs')
  const j = browser.getCookieJar()
  const request = requestFactory({
    jar: j
  })
  await saveFiles(myBills, fields, {
    requestInstance: request,
  })
```

## I prefer to use cheerio to parse data, even with zombie

It is still possible to access the html of the current page with zombie and you can then load it in
a cheerio object :

```js
  const cheerio = require('cheerio')
  const $ = cheerio(await browser.html())
```
