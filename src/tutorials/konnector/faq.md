## FAQ

### When I run my connector, a ghost node process eats all my memory

Cozy-konnector-libs uses [cheerio](https://cheerio.js.org) which is great but causes some problems
when you try to console.log a cheerio object.

In standalone or dev mode, the BaseKonnector tries to catch errors and display a maximum of details
about them. But when the error contains a cheerio object, the problem happens.

If you get this problem, catch the error yourself and only display the message :

```javascript
.catch(err) {
  console.log(err.message) // good
  console.log(err) // bad
}
```

### How do I scrap a website

Use the request function from [cozy-konnector-libs][] with the proper options.

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

[cozy-konnector-libs]: https://github.com/konnectors/libs
