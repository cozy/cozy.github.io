In this part, we are going to see how to scrape data from the service you want to retrieve your data from. If not done yet, you want to check the [getting started guide](./getting-started.md). 

## Implement your konnector

>For the purpose of this guide, let's consider we are in the case of a full HTML webpage, like the service given as an example in the template: http://books.toscrape.com

There are three steps for a konnector to save data to [Cozy Stack](https://github.com/cozy/cozy-stack):

1. Authentication
2. Scrap and/or request data
3. Parse and format data
4. Save data to cozy stack

In a _client-side connector_ those steps are mainly done by the following three functions called by the [ContentScript.js](https://github.com/cozy/cozy-react-native/blob/master/connectors/connectorLibs/ContentScript.js) each and every time the konnector is triggered.

```javascript
/////////
//PILOT//

async ensureAuthenticated() {
    // First step
}

async getUserDataFromWebsite() {
    // Second step &
    // Third step
}

async fetch(context) {
    // Fourth step
}


```
As mentionned, those three fundamental function are called every time the konnector is executing, but it is up to you to custom them regarding your needs and the service you are expecting to take the data from.

> ### The pilot/worker principle
> A very specific notion important to keep in mind :
>  
> We are using two webviews to make a konnector run
> - a `Pilot`
> - and a `Worker`
> 
> As explicit as the name can be, the `Pilot` treats with the cozy-stack, the `Worker` interacts with the webservice and sends information to the `Pilot`.
> Both accesses the ContentScript.js methods, but some methods are designed to be restricted (like `runInWorker`, only usable in the `Pilot`) but we'll come to that in details during this tutorial.

___

### Authentication

Open the `src/index.js` file, there are comments to guide you through it.
The very first step is to be able to define if the user is authenticated to the remote service, this is done with:


```javascript
async ensureAuthenticated() {}
```

As `books.toscrape.com` does not have any login form, let's say the remote service exposes a simple classical form like [trainline.eu](https://www.trainline.eu/signin) :

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
At this point, you got to tell the `Pilot` to set the `Worker` on the wanted web page (baseUrl). To be sure the page is loaded properly, you need to wait for an HTML element (here, let's say it is the button leading you to the quotes page).

```javascript
async ensureAuthenticated() {
    await this.goto(baseUrl) // Set the worker on the baseUrl
    await this.waitForElementInWorker(defaultSelector) // Wait for quotes link element in the worker
  }
```

Once `waitForElementInWorker` will respond, you try to click on this button and wait for another element telling you the page is loaded. Here we are waiting for either a button to a login page or the logout button.

```javascript
async ensureAuthenticated() {
    await this.goto(baseUrl)
    await this.waitForElementInWorker(defaultSelector)
    await this.runInWorker('click', defaultSelector) // Click on quotes link element in the worker
    
    await Promise.race([
      this.waitForElementInWorker(loginLinkSelector), 
      this.waitForElementInWorker(logoutLinkSelector)
    ]) // Wait for both logout or login link to be sure to check authentication when ready
  }
```

When one of them is true, you need to check if the user is already logged in or not. If not, we trigger the `showLoginFormAndWaitForAuthentication` function.

```javascript
async ensureAuthenticated() {
    await this.goto(baseUrl)
    await this.waitForElementInWorker(defaultSelector)
    await this.runInWorker('click', defaultSelector)
    await Promise.race([
      this.waitForElementInWorker(loginLinkSelector),
      this.waitForElementInWorker(logoutLinkSelector)
    ])
    const authenticated = await this.runInWorker('checkAuthenticated') // Checking authentication
    if (!authenticated) {
      this.log('not authenticated')
      await this.showLoginFormAndWaitForAuthentication() // Triggering the user authentication process
    }
    return true // Return true to continue konnector execution
  }
```

The `showLoginFormAndWaitForAuthentication` function will remain at least like this : 

```javascript
async showLoginFormAndWaitForAuthentication() {
    await this.setWorkerState({ visible: true }) // Show the webview to the user
    await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' }) // Wait for user to connect
    await this.setWorkerState({ visible: false }) // Hide the webview to the user
  }
```
You can always add more actions to it if you need so, but those three are mandatory.

- First will show to the user the `Worker` webview.
- Second will actually wait for the user manual authentication. This will trigger `waitForAuthenticated` which wait for `checkAuthenticated` to return true from the worker (more about it in an instant). This allows us to bypass eventual captcha/2FA or anti-bot securities. 
- Last will hide the `Worker` webview from the user before continuing execution.

```javascript
async showLoginFormAndWaitForAuthentication() {
    log.debug('showLoginFormAndWaitForAuthentication start') // You can add some logs of course
    await this.clickAndWait(loginLinkSelector, '#username') // Or an action before or after . Here we clicking on the loginPage element and wait for the username input of the form
    await this.setWorkerState({ visible: true })
    await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' })
    await this.setWorkerState({ visible: false })
  }
```
`checkAuthenticated` is a `ContentScript.js` method that you need to customize and it needs to return true at some point. This is a check to determine if the user login had been successful or not and as it is launched with `runInWorkerUntilTrue`, it will run again and again until ... well, until it responds `true` !

```javascript
async checkAuthenticated() {
    if(document.querySelector(logoutLinkSelector)){ 
      this.log('Auth Check succeeded')
      return true
    }
    return false
  }

```
In the block example above, if we find the `logoutLinkSelector`, it means the user is actually connected, so the function might return `true`.
___

### Getting the data

Once the user has been authenticated, the konnector is able to navigate on the web service to fetch data. The most common case is that the invoices we want to fetch are listed in a HTML page. So to fetch data, we navigate to the target webpage that contains invoices list like a user would.

But sometimes, the webpage is a JavaScript page that uses a JSON API URL. We'll cover this case later in this tutorial.

First you need to customize the `getUserDataFromWebsite` function. Remember, every actions needed to be taken to access the data you are looking for must be execute in the `Worker` webview. Some functions are already forseen in the `ContentScript`, but for mor complex action, you will need to make your own. So how it works ?

In this example, we wanna scrap data of the user but also the `Music` section. 

Let's start with the books section

```javascript
async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector) // Calling ContentScript method 'click' in the worker
  await this.waitForElementInWorker(sectionHeaderSelector)
}
```

Now we need to check if the landing page is what we expected. On this website, one of the way to do this is to see if the element with the class `section-header` is containing the string "Music". To do this, we'll need a more powerful function than the ones we have in the `ContentScript`. Let's do this :

First, you will need to declare this function to the `ContentScript`, so it knows it exist and it can be triggered. At the very bottom of the `index.js`, you can find the `connector.init` function taking one argument with an array `additionalExposedMethodsNames`.

Everytime you will need to build a new function for the pilot to give to the worker, you will need to declare it in this array like so :

```javascript
connector.init({ additionalExposedMethodsNames: [
  'checkIfRightPage',
] })

```
Now it is done, we can give it to the `Worker` : 

```javascript
async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector)
  await this.waitForElementInWorker(sectionHeaderSelector)
  await this.runInWorker('checkIfRightPage')
}
```
And define what the function will do.

```javascript
// Homemade function can be async too
checkIfRightPage() {
  const selectorContent =  document.querySelector(sectionHeaderSelector).textContent.trim()
  if(selectorContent === "Music"){
    return true
  }
  return false
}
```

At this point, your new function should return true, so let's continue.

Because you are checking and returning a value, you can now decide what to do depending on the response.

```javascript
async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector)
  await this.waitForElementInWorker(sectionHeaderSelector)
  const isRight = await this.runInWorker('checkIfRightPage')
  if(isRight){
    let
    await this.runInWorker('getBooksData') // Another custom function, with an argument
  }else{
    throw new Error('Something went wrong when accessing the Music section')
  }
}
```
Dont forget to declare it ! 

```javascript
connector.init({ additionalExposedMethodsNames: [
  'checkIfRightPage',
  'getBooksData',
] })

```
And define what it will do.


```javascript
getBooksData() {
  const bookList = document.querySelectorAll(musicBooksSelector)
  allBooks = []
  for (const book of bookList){
    const aBook = book.children[0]
    const title = aBook.children[2].children[0].getAttribute('title')
    const starRating = aBook.children[1].getAttribute('class').split(' ')[1]
    const price = aBook.children[3].children[0].textContent
    const inStock = aBook.children[3].children[1].textContent.includes('In stock')
    const fileurl = aBook.children[3].children[2].getAttribute('href')
    const filename = `${title.replace(/ /g, '-')}_${starRating}-stars_${price}.pdf`
    const newBook = {
      fileurl,
      filename,
      title,
      starRating,
      price,
      inStock
    }
    allBooks.push(newBook)
  }
  await this.sendToPilot({allBooks}) 
}
```

>Once you are at the `Worker` level, if you need more functions, these ones do not need to be declared in `additionalExposedMethodsNames`, juste add it into the Class.

Now the `Music` section has been scraped and the result of this scraping is return and stocked in the `musicBooks` variable, let's do the same for the user data.

```javascript
async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector)
  await this.waitForElementInWorker(sectionHeaderSelector)
  const isRight = await this.runInWorker('checkIfRightPage')
  if(isRight){
    await this.runInWorker('getMusicBooksData')
    await this.clickAndWait(personnalInfoSectionSelector, sectionHeaderSelector) // Once again you can test the page, we won't do this here for clarity
    await this.runInWorker('getUserData') // One more custom function
  }else{
    throw new Error('Something went wrong when accessing the Music section')
  }
}
```
Never forget to declare it.

```javascript
connector.init({ additionalExposedMethodsNames: [
  'checkIfRightPage',
  'getMusicBooksData',
  'getUserData',
] })

```

And define what it will do. In this website, there are no login possible so there no user's informations page. We'll just act like there is one.

```javascript
getUserData() {
  const userInfos = document.querySelector(userInfosSelector)
  const name = userInfos.children[0]
  const [firstName, lastName] = name.split(' ')
  const [street, city, postCode, country] = userInfos.children[1].textContent.split(',')
  const mobilePhoneNumber = userInfos.children[2].textContent
  const email = userInfos.children[3].textContent
  // This is the standard format for a cozy identity
  const userIdentity = {
    email,
    name:{
      firstName,
      lastName,
      fullName = `${firstName} ${lastName}`
    },
    address : [
      {
        formattedAddress : userInfos.address,
        street,
        city,
        postCode,
        country
      }
    ],
    phone : [
      {
        type : 'mobile',
        number : mobilePhoneNumber
      }
    ]
  }
  await this.sendToPilot(userIdentity)
}
```

There we have both wanted data, let's speak about the `sendToPilot`.

As mentioned earlier, the `Pilot` _do not_ see what's happening in the `Worker`. It cannot access the page like the `Worker` does so it cannot find and manipulate the data by itself. It is a way for us to ensure that there is no communication between the website and your cozy. The `Pilot` is the only one who can save data into your cozy, but the `Worker` is the only one who could access these data. The only way to access any type of data manipulations in the `Pilot` is to pass the data from the `Worker` to the `Pilot`. This is done with `sendToPilot`.

This function will trigger a `storeFromWorker` function on the `Pilot` side and will save the data into the `store`. You will be able to access this data anywhere in the execution now, in the `Pilot` with `this.store` and in the `Worker` when passing the store as an argument of a function.

To finished properly the `getUserDataFromWebsite` function, the stack is waiting for a `sourceAccountIdentifier` to get returned. 

If you found an email while scraping the user's data, it is usually what is used. If you don't end up with an email for some reason, you got to define at the beginning of the code a  `DEFAULT_SOURCE_ACCOUNT_IDENTIFIER` with the vendor's name.

```javascript
const DEFAULT_SOURCE_ACCOUNT_IDENTIFIER = "bookstoscrape"

async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector)
  await this.waitForElementInWorker(sectionHeaderSelector)
  const isRight = await this.runInWorker('checkIfRightPage')
  if(isRight){
    await this.runInWorker('getMusicBooksData')
    await this.clickAndWait(personnalInfoSectionSelector, sectionHeaderSelector)
    await this.runInWorker('getUserData')
  }
  if(this.store.userIdentity.email){ // getUserData is supposed to have sent the userIdentity to the pilot, so we check the store
    return { sourceAccountIdentifier : this.store.userIdentity.email }
  } else {
    this.log("Couldn't get a sourceAccountIdentifier, using default")
    return { sourceAccountIdentifier: DEFAULT_SOURCE_ACCOUNT_IDENTIFIER }
  }

}
```

Well done, you just finished the data part !
Now let's save it with the `fetch` method, the last step in freeing your data with a client-side konnector.
___
### Saving the data

Saving data is pretty easy after the work done above and it's done within `fetch`.
```javascript
async fetch(context) {}
```

One thing you will need everytime when you want to save files in your cozy is the `context`. This allows the `Pilot` to use the same contex as the `Worker`, meaning the download call will look like it is made from the same webview as the navigation was made.

Next, you have some questions to ask to yourself before actually saving those data on your cozy.

- What type of file is it ?

You need to define if the file you are about to save is either a _bill_ or a _file_.
The specificity of the _bill_ is that it represents actual invoices. It could be linked to operations in your Cozy Banks, but it will need some data like an `amount` and a `vendor` added . Here we gonna save the books "themselves", as there is no actual file to download, we'll pretend we're saving the `.pdf` of the books so let's go with a `saveFiles`

- What is the content type of the file ? 

Usually something you can find in headers, describing what type of content is supposed to be downloaded. For us it's a `pdf` (like the majority of the files you will save on your cozy), but it can be anything : zip, photos, excel sheets ...

- What will be the attribute on which the deduplication will base its logic ?

The `fileIdAttribute` will use the given attribute to know if the file needed to be saved or if it had already been downloaded. The simpliest way to differentiate two files is by their name, but in some cases (like _linked bills_) you will need something more revelant for the linking operation to hold all the bills for a same month and still save one file per month.

- What is the qualification label for these documents ?

Cozy follows certains conventions regarding the documents qualification, you can find the list of [available qualifications](https://github.com/cozy/cozy-client/blob/master/packages/cozy-client/src/assets/qualifications.json) and see if something is fitting your needs. Otherwise for now it is recommended to not qualify them at all.
Here, even if the qualification does not exist, let's say it is "digital_book".

```javascript
async fetch(context) {
    this.log("fetch starts")
    // Passing our scraping result containing all our books and their data to saveFiles
    // And options Object with the answers of our interrogations
    await this.saveFiles(this.store.allBooks, { 
      context,
      contentType: 'application/pdf',
      fileIdAttributes: ['filename'],
      qualificationLabel: 'digital_book'
    })
  }
```

If needed, you can add some actions in `fetch` before or after the `saveFiles`.
Here we'll pretend we need to disconnect from the webservice after retrieving the data.

For that, we can simply click on the logout button in the worker and wait for the button leading you to the login form

```javascript
async fetch(context) {
    this.log("fetch starts")
    // Passing our scraping result containing all our books and their data to saveFiles
    // And options Object with the answers of our interrogations
    await this.saveFiles(this.store.allBooks, { 
      context,
      contentType: 'application/pdf',
      fileIdAttributes: ['filename'],
      qualificationLabel: 'digital_book'
    })
    await this.clickAndWait(logoutButtonSelector, loginButtonSelector)
  }
```
And that's all done ! You successfully saved your data, you now have new books to read in your cozy !

This is the basics of freeing your data with a client-side konnector. We will address a topic about more specific cases requiring other `ContentScript` methods and other technics to get back what you own (your data, right ?).

Just for information, this is what your konnector should look like all together : 

```javascript
const DEFAULT_SOURCE_ACCOUNT_IDENTIFIER = "bookstoscrape"

class TemplateContentScript extends ContentScript {
//////////
//PILOT //
//////////
async ensureAuthenticated() {
  await this.goto(baseUrl)
  await this.waitForElementInWorker(defaultSelector)
  await this.runInWorker('click', defaultSelector)
  await Promise.race([
    this.waitForElementInWorker(loginLinkSelector),
    this.waitForElementInWorker(logoutLinkSelector)
  ])
  const authenticated = await this.runInWorker('checkAuthenticated')
  if (!authenticated) {
    this.log('not authenticated')
    await this.showLoginFormAndWaitForAuthentication()
  }
  return true
}

async showLoginFormAndWaitForAuthentication() {
  log.debug('showLoginFormAndWaitForAuthentication start')
  await this.clickAndWait(loginLinkSelector, '#username')
  await this.setWorkerState({ visible: true })
  await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' })
  await this.setWorkerState({ visible: false })
}

async getUserDataFromWebsite() {
  await this.runInWorker('click', musicSectionSelector)
  await this.waitForElementInWorker(sectionHeaderSelector)
  const isRight = await this.runInWorker('checkIfRightPage')
  if(isRight){
    await this.runInWorker('getMusicBooksData')
    await this.clickAndWait(personnalInfoSectionSelector, sectionHeaderSelector)
    await this.runInWorker('getUserData')
  }
  if(this.store.userIdentity.email){
    return { sourceAccountIdentifier : this.store.userIdentity.email }
  } else {
    this.log("Couldn't get a sourceAccountIdentifier, using default")
    return { sourceAccountIdentifier: DEFAULT_SOURCE_ACCOUNT_IDENTIFIER }
  }

}

async fetch(context) {
  this.log("fetch starts")
  await this.saveFiles(this.store.allBooks, { 
    context,
    contentType: 'application/pdf',
    fileIdAttributes: ['filename'],
    qualificationLabel: 'digital_book'
  })
  await this.clickAndWait(logoutButtonSelector, loginButtonSelector)
}

//////////
//WORKER//
//////////

async checkAuthenticated() {
  if(document.querySelector(logoutLinkSelector)){ 
    this.log('Auth Check succeeded')
    return true
  }
  return false
}

checkIfRightPage() {
  const selectorContent =  document.querySelector(sectionHeaderSelector).textContent.trim()
  if(selectorContent === "Music"){
    return true
  }
  return false
}

getUserData() {
  const userInfos = document.querySelector(userInfosSelector)
  const name = userInfos.children[0]
  const [firstName, lastName] = name.split(' ')
  const [street, city, postCode, country] = userInfos.children[1].textContent.split(',')
  const mobilePhoneNumber = userInfos.children[2].textContent
  const email = userInfos.children[3].textContent
  const userIdentity = {
    email,
    name: {
      firstName,
      lastName,
      fullName = `${firstName} ${lastName}`
    },
    address: [
      {
        formattedAddress : userInfos.address,
        street,
        city,
        postCode,
        country
      }
    ],
    phone: [
      {
        type : 'mobile',
        number : mobilePhoneNumber
      }
    ]
  }
  await this.sendToPilot(userIdentity)
}
}

connector.init({ additionalExposedMethodsNames: [
  'checkIfRightPage',
  'getMusicBooksData',
  'getUserData',
] }).catch(err => {
  console.warn(err)
})
```
