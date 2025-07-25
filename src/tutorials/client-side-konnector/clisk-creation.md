# CliSK Creation

In this section you will learn how to develop your own konnector from the [CliSK template](https://github.com/konnectors/template_ccc).

### Introduction to Client-Side Konnectors (CliSK)

A CliSK is a type of konnector using a webview to simulate a browser into the Twake App. It's allowing the developer to interact directly on the website via a script or by giving back the control to the user when needed. Very useful to bypass bot detection by inducing a real human interaction on the website on sensible phases such as login, 2FA or any type of captcha.

### CliSK architecture

##### How does it work ?

The CliSK contains two webviews.

- One called `pilot`
- Second called `worker`
  We will use those names during the tutorial, as it is part of mandatory understanding to make your konnector.

###### Pilot

The `pilot` webview is here to ensure the communication between the worker (navigating the web) and the Twake App. It "pilots" (clever, right ?) the worker's actions and gives back the result to the Twake App. It also keeps the state of the konnector execution.

###### Worker

The `worker` webview is like a very simple browser. It will navigate, interact, fill, scrap, intercept requests ... Pretty much the big part of the execution. It will return everything to the `pilot` in the end. That's the one you will be seeing when developing your konnector.

###### Store

It allows the developer to store data if needed like request's responses with interesting data, or scraped data that will be useful further down the execution

###### Library

The used library for CliSK development is the [cozy-clisk](https://github.com/konnectors/libs/tree/master/packages/cozy-clisk) library.
We will cover it all in a [dedicated documentation](./clisk-lib-doc.md)

---

### Creating a CliSK for "books.toscrape.com"

#### Creating your own CliSK

If you want to develop a konnector from scratch, you will need to get the [CliSK template](https://github.com/konnectors/template_ccc) on your machine.
Copy the template's file to a new directory named after the service you want to scrap. Let's say we will scrap the better website of all time for this job : [Books to scrap](http://books.toscrape.com) but as this website does not contains any login logic, we'll be using the one from [practicetestautomation.com](https://practicetestautomation.com/practice-test-login/) to simulate a login before scraping the books.

Get your terminal in the directory where you have saved the `template_ccc` and copy the files to a new directory :

```bash
cp -r template_ccc bookstoscrap
```

_Note : the `cozy-konnector-[slug]` convention for naming has been deprecated, let's keep it simple and just use the name of the targeted website/company_.

---

#### Let's start

We will describe step by step how to develop a CliSK and for this, we've made you a [Pull Request on our CliSK template](https://github.com/konnectors/template_ccc/pull/78) , with explanations on every commit, so you directly have a code reference instead of putting a whole `index.js` file here in the documentation. Anyway, we still will describe step by step here too to fit to everyone preferences. So let's jump right in !

#### Konnector's manifest

First thing first, we need to adapt the `manifest.konnector` file to the targeted website.

You will need to edit some of the values found in this file to give information to the cozy machinery when the konnector will be installed later.

The mandatory are the following :

- `name` => The displayed name on the cozy store
- `slug` => The konnector's identifier. Only lower case letters and numbers are admitted.
- `source` => The source of the konnector's file. Will always be `git@github.com:konnectors/[slug].git`
- `vendor_link` => The main URL of the targeted website.
- `categories` => Categories where the konnector will be displayed in the cozy store. See [here](https://github.com/cozy/cozy-client/blob/master/packages/cozy-client/src/assets/qualifications.json) for the list of available categories. If you can't find the category you seek in the list, contact Cozy and we will discuss its addition.
- `developer`
  - `name` => The name of the developer displayed in the cozy store.
  - `link` => A link to your github profile or personal page so people knows who to thanks for this konnector.
- `locales`
  - `fr`
    - `short_description` => A quick description of what's the konnector is made for.
    - `long_descritption` => A longer description of what is the service of the targeted website, what can be fetched in it, and what data are saved by this konnector.

Others values must not be touched (unless discussed otherwise of course).

In the end, your modified manifest should look like this :

```json
{
  "version": "1.0.0",
  "name": "Books To Scrape",
  "type": "konnector",
  "language": "node",
  "icon": "icon.svg",
  "slug": "bookstoscrape",
  "source": "git@github.com:konnectors/bookstoscrape.git",
  "editor": "Cozy",
  "vendor_link": "https://books.toscrape.com/",
  "categories": ["shopping"],
  "fields": {},
  "clientSide": true,
  "langs": ["fr"],
  "folders": [
    {
      "defaultDir": "$administrative/$konnector/$account"
    }
  ],
  "permissions": {
    "bills": {
      "type": "io.cozy.bills"
    },
    "files": {
      "type": "io.cozy.files"
    },
    "identities": {
      "type": "io.cozy.identities"
    }
  },
  "developer": {
    "name": "Frodo Baggins",
    "url": "https://github.com/FrodoBaggins"
  },
  "locales": {
    "fr": {
      "short_description": "Récupère la liste de livres",
      "long_description": "Récupère la liste de livre sur le site exemple",
      "permissions": {
        "bills": {
          "description": "Utilisé pour sauver les données des factures"
        },
        "files": {
          "description": "Utilisé pour sauvegarder les factures"
        }
      }
    }
  }
}
```

You can find the [example commit](https://github.com/konnectors/template_ccc/pull/78/commits/db9fedee4af79644120ca4a598f4dc484209f9ad) in the [development example pull request](https://github.com/konnectors/template_ccc/pull/78) to see the modifications from the template's manifest.

#### Cleaning

Then, clean the template's code, but keep the main functions launch by the pilot :

- `ensureAuthenticated`
- `ensureNotAuthenticated`
- `checkAuthenticated`
- `getUserDataFromWebsite`
- `fetch`

Those will be the minimum mandatory functions launch by the Twake App to execute your code.

⚠️ Note : You won't need to call them explicitly anywhere in the code as the Twake App call them itself. However you will _need_ to override them to fit the wanted flow for the targeted website.

When done, your Class in `src/index.js` file should look like this :

```javascript
class BookToScrapeContentScript extends ContentScript {
  onWorkerReady() {}

  onWorkerEvent({ event, payload }) {}

  async ensureAuthenticated({ account }) {
    this.log("info", "🤖 ensureAuthenticated");
  }

  async ensureNotAuthenticated() {
    this.log("info", "🤖 ensureNotAuthenticated");
  }

  async showLoginFormAndWaitForAuthentication() {
    this.log("info", "🤖 showLoginFormAndWaitForAuthentication");
    await this.setWorkerState({ visible: true });
    await this.runInWorkerUntilTrue({
      method: "waitForAuthenticated",
    });
    await this.setWorkerState({ visible: false });
  }

  async checkAuthenticated() {}

  async getUserDataFromWebsite() {
    this.log("info", "🤖 getUserDataFromWebsite");
  }

  async fetch(context) {
    this.log("info", "🤖 fetch");
  }
}
```

You can find the example commit [here](https://github.com/konnectors/template_ccc/pull/78/commits/de069767fd60f0fbff3dc66c245d543f4b429a74) in the pull request provided for development example.

#### Scripting

You can now start with the first three functions of the list.They all interact together to prepare for the first login of the user :

##### `ensureNotAuthenticated`

Will usually try reach the connected user's homePage, as most of the websites will redirect you on the loginForm if you are not logged in. If you are, this function will navigate on the website by clicking or reaching out the logout URL to disconnect the actual account from the website and returning on the loginForm if needed.

```javascript
async ensureNotAuthenticated() {
    this.log('info', '🤖 ensureNotAuthenticated')
    await this.goto(loginSuccessfullUrl)
    await this.waitForElementInWorker(`${usernameInputSelector}, ${connectedElementSelector}`)
    const authenticated = await this.runInWorker('checkAuthenticated')
    if(!authenticated){
      this.log('info', 'ensureNotAuthenticated - User is already disconnected')
      return true
    }
    await this.runInWorker('click', logoutButtonSelector)
    await this.waitForElementInWorker(usernameInputSelector)
    this.log('info', 'ensureNotAuthenticated - User has been disconnected')
    return true
  }
```

Check the [example commit](https://github.com/konnectors/template_ccc/pull/78/commits/74124b653ae8424891cff4283a0a8042700f48d3) for `ensureNotAuthenticated`

##### `ensureAuthenticated`

Will check if a `cozy account` is already created and if credentials are already saved fo this konnector. It will always have an object parameter containing a `cozy account` that is given automatically by the `clisk library`. It will be used to determine if the website's session needs to be closed before executing the first run. It is based on the presence of an existing `cozy account` **or** the presence of saved credentials for this konnector. If one or the other is missing, we will ensure the user can log in by presenting him the login page on the first run so we can try and intercept his credentials to save them for later runs, and maybe use them for automatic filling or automatised full login phase.

```javascript
async ensureAuthenticated({ account }) {
    this.log('info', '🤖 ensureAuthenticated')
    const credentials = await this.getCredentials()
    if (!account || !credentials) {
      await this.ensureNotAuthenticated()
    }
    await this.showLoginFormAndWaitForAuthentication()
    this.log('info', 'ensureAuthenticated - Login successfull !')
    return true
  }
```

Check the [example commit](https://github.com/konnectors/template_ccc/pull/78/commits/412c697beac9ff1b93816a9fe13b8817d5e0515e) for `ensureAuthenticated`

##### `checkAuthenticated`

Will check if the targeted elements are present or not to determine if the user is connected. It will simply return `true` or `false`. Avoid returning a `string`, a `number` or else as the library will automatically process it as a Boolean in the end.

Authentication is done, now we have to find a `sourceAccountIdentifier` to create the linked account and its associated konnector's trigger.
For this we will be using the `workerEvents` to intercept the credentials if possible and will use this intercepted credentials in the `getUserDataFromWebsite`.

A simple `checkAuthenticated` will look like this, simply check the presence of an element showing the user he is connected :

```javascript
async checkAuthenticated() {
	return Boolean(document.querySelector(connectedElementSelector))
}
```

Take a look a the [`ensureNotAuthenticated`commit](https://github.com/konnectors/template_ccc/pull/78/commits/74124b653ae8424891cff4283a0a8042700f48d3#diff-bfe9874d239014961b1ae4e89875a6155667db834a410aaaa2ebe3cf89820556R60) to see the `checkAuthenticated` usage.

##### `onWorkerReady` & `onWorkerEvent`

Those two functions works in tandem. `onWorkerReady` will be used to subscribe on DOM events on the current page so we can watch those events and emit a `workerEvent` when meeting conditions. `onWorkerEvent` is called by the `pilot` whenever an event is sent by the `worker` to the bridge. It could be used for various situations like watch for known errors, captcha detection or intercept data. In our case, we will use them for credentials interception by listening to the "click" event on the submit button of the loginForm. This way, every time this page is loaded, listener will be set and every time the submit button is clicked, `onWorkerReady` will emit a `workerEvent` containing the type of event and the needed payload. `onWorkerEvent` will then send the received payload to the bridge to be saved in the store.

Don't forget to add the listener on `workerEvents` at the beginning of the konnector's execution, in `ensureAuthenticated`:

```javascript
this.bridge.addEventListener('workerEvent',this.onWorkerEvent.bind(this)
```

Your `onWorkerReady` should look like this :

```javascript
async onWorkerReady() {
    function addClickListener() {
      document.body.addEventListener('click', e => {
        const clickedElementId = e.target.getAttribute('id')
        if (clickedElementId === 'submit') {
          const login = document.querySelector(
            usernameInputSelector
          )?.value
          const password = document.querySelector(passwordInputSelector)?.value
          this.bridge.emit('workerEvent', {
            event: 'loginSubmit',
            payload: { login, password }
          })
        }
      })
    }
    await this.waitForDomReady()
    if (
      (await this.checkForElement(usernameInputSelector)) &&
      (await this.checkForElement(passwordInputSelector))
    ) {
      this.log(
        'info',
        'Adding the click listener on the submit button'
      )
      addClickListener.bind(this)()
    }
  }
```

Your `onWorkerEvent` should look like this :

```javascript
async onWorkerEvent({ event, payload }) {
    if (event === 'loginSubmit') {
      const { login, password } = payload || {}
      if (login && password) {
        this.log('info', 'Credentials successfully intercepted')
        this.store.userCredentials = { login, password }
      }
    }
  }
```

Check the [example commit](https://github.com/konnectors/template_ccc/pull/78/commits/1a6e71048a54750f86b62970beaac217ecaa7121) to see what a basic interception looks like.

##### `getUserDataFromWebsite`

Will check if there is any credentials intercepted or saved for this konnector to return a `sourceAccountIdentifier`(`SAI`). Priority is set on the login used by our user to log himself on the loginForm page. If it has been intercepted correctly or if this isn't the first run and it was already saved, we will find them respectively in `this.store` or returned by the `getCredentials` function. If for some reasons there is no intercepted or saved credentials, we will fallback on a handmade `worker`'s function to find an `SAI` to scrape on the website. At this point, you will need to declare this new function in the `additionalExposedMethodsNames` array passed as argument to the `init` function for the pilot to call it properly.

It can look like this :

```javascript
async getUserDataFromWebsite() {
    this.log('info', '🤖 getUserDataFromWebsite')
    const credentials = await this.getCredentials()
    const credentialsLogin = credentials?.login
    const storeLogin = this.store?.userCredentials?.login
    let sourceAccountIdentifier = credentialsLogin || storeLogin
    if (!sourceAccountIdentifier) {
      sourceAccountIdentifier = await this.runInWorker('findValidSAI')
    }
    if (!sourceAccountIdentifier) {
      throw new Error('Could not get a sourceAccountIdentifier')
    }
    return {
      sourceAccountIdentifier: sourceAccountIdentifier
    }
  }
```

A simple `findValidSAI` will be similar to this :

```javascript
async findValidSAI () {
    this.log('info', '📍️ findValidSAI starts')
    const usernameElementContent = document.querySelector(usernameSelector).textContent
    const validSAI = usernameElementContent.split('.')[0].split(' ')[1].trim()
    return validSAI
  }
```

Don't forget to add it to the `additionalExposedMethodsName` at the end of the file as follows :

```javascript
const connector = new BookToScrapeContentScript();
connector
  .init({ additionalExposedMethodsNames: ["findValidSAI"] })
  .catch((err) => {
    log.warn(err);
  });
```

Check the [example commit](https://github.com/konnectors/template_ccc/pull/78/commits/56ae90d7093a6c9263674a2783420311dcfbf8fb) to see how it is done.

Once we got a `sourceAccountIdentifier` to return, it is now time for proper scraping to retrieve wanted files & data. So let's dive in `fetch` !

##### `fetch`

Where all the magic happens. It will be used to find and scrape the files and data to be stored in the cozy instance like invoices, attestations or user identity. We will navigate through the website to reach the pages containing the sought data. Again, there is several different ways to achieve this goal, but for the example we'll keep it purely scraping. We will need to create a new `worker`'s function to be able to locate and retrieve the data.This new function will return the found data at the end of its execution to be saved on the cozy instance. Same will be done to fetch the user's identity.

We will start this function by saving credentials if any has been found.

```javascript
if (this.store.userCredentials != undefined) {
  await this.saveCredentials(this.store.userCredentials);
}
```

Then we will make the first navigation to reach the page where we can find the sought data.

```javascript
await this.goto(homePageUrl);
await this.waitForElementInWorker(productCardSelector);
```

We will check the number of available pages with another handmade `worker`'s function (again, don't forget to declare it in the `init`'s array argument so it became callable by the `pilot`). For example's sake in the [example PR](https://github.com/konnectors/template_ccc/pull/78/commits/0d4f8f706bda079345bd754b066a048fc7c13eca), we will not scrape the whole 50 pages of the website, so we're limiting the number of wanted pages.

```javascript
// In fetch function
const numberOfPages = await this.runInWorker('getNumberOfPages')
this.log('info', `numberOfPages : ${numberOfPages}`)

// Handmade worker function
async getNumberOfPages() {
	this.log('info', '📍️ getNumberOfPages starts')
	const foundNumber = Number(
document.querySelector(currentPageSelector).textContent.trim().split(splitChar)[1]
	)
	this.log('info', `Found ${foundNumber} pages`)
	return foundNumber
}

// Declaration
const connector = new BookToScrapeContentScript()
connector.init({
	additionalExposedMethodsNames: [
		'findValidSAI',
		'getNumberOfPages'
	]
})
.catch(err => {
log.warn(err)
})
```

Using the number of found page, we will loop on another handmade `worker`'s function to scrape and format the files. On each loop, the `worker` will get the files, format them, and return the files to the `pilot`. Then the `pilot` will push those files in an array that will be given to the `saveFiles` function to be saved in the cozy instance.

```javascript
// Loop in fetch function
let page = 1
	const filesToSave = []
	while (page < numberOfPages) {
		const files = await this.runInWorker('getFiles')
		filesToSave.push(...files)
	}

// Handmade worker function
async getFiles() {
	this.log('info', '📍️ getFiles starts')
	const productCards = document.querySelectorAll('.product_pod')
	const pageFiles = []
	for (const productCard of productCards) {
		const product = {
			amount: normalizePrice(
			productCard.querySelector('.price_color')?.innerHTML
			),
			date: '2025-01-01',
			vendor: 'bookstoscrape',
			filename: productCard.querySelector('h3 a')?.getAttribute('title'),
			fileurl:'https://books.toscrape.com/' + productCard.querySelector('img')?.getAttribute('src'),
			vendorRef: productCard.querySelector('img')?.getAttribute('src')
		}
		pageFiles.push(product)
	}
	return pageFiles
}

// Declaration
const connector = new BookToScrapeContentScript()
connector.init({
	additionalExposedMethodsNames: [
		'findValidSAI',
		'getNumberOfPages',
		'getFiles'
	]
})
.catch(err => {
log.warn(err)
})
```

After that a new handmade `pilot`'s function will navigate to the next page to scrape. This function does not need to be declared like the `worker`'s, as they are directly accesible by the `pilot` to call. Nothing specific here, it will reach the wanted page number given in argument and will wait for the wanted selector to appear in the DOM.

```javascript
// Loop in fetch function
while (page < numberOfPages) {
	const files = await this.runInWorker('getFiles')
	filesToSave.push(...files)
	await this.navigateToNextPage(page + 1)
	page++
	this.log('info', `page end of loop : ${page}`)
}

// Handmade pilot function
async navigateToNextPage(targetedPage) {
	this.log('info', '📍️ navigateToNextPage starts')
	await this.goto(`https://books.toscrape.com/catalogue/page-${targetedPage}.html`)
	await this.waitForElementInWorker(`a[href*="page-${targetedPage + 1}.html"]`)
	this.log('info', `navigation to page ${targetedPage} completed`)
}

// No declaration needed here as it is a new `pilot` function
```

After all the loops are completed, the fulfilled array is given to `saveFiles` function with the `context` , a `fileIdAttributes` set on a unique identifier for each file, and a `contentType` to tell the instance which type of file is saved as second argument.

And there we are, files has been saved on the instance and can be accessed in the instance's drive.

All good, now your `fetch` function should look something like this :

```javascript
async fetch(context) {
	this.log('info', '🤖 fetch')
	if (this.store.userCredentials != undefined) {
		await this.saveCredentials(this.store.userCredentials)
	}
	await this.goto(homePageUrl)
	await this.waitForElementInWorker(productCardSelector)
	const numberOfPages = await this.runInWorker('getNumberOfPages')
	this.log('info', `numberOfPages : ${numberOfPages}`)
	let page = 1
	const filesToSave = []
	while (page < numberOfPages) {
		const files = await this.runInWorker('getFiles')
		filesToSave.push(...files)
		await this.navigateToNextPage(page + 1)
		page++
		this.log('info', `page end of loop : ${page}`)
	}
	await this.saveFiles(filesToSave, {
		context,
		fileIdAttributes: ['vendorRef'],
		contentType: 'image/jpeg'
	})
}
```

Last thing to do is to scrape the user's identity. For this the konnector will navigate to the personal infos page and the worker will scrape and return an object full of data to be saved on the instance. It is usually done at the very end of the execution because the priority is to get the files.

```javascript
// In fetch function after files scraping and saving
const userIdentity = await this.runInWorker('getUserIdentity')
await this.saveIdentity({ contact: userIdentity })

// Handmade worker function
async getUserIdentity () {
	this.log('info', '📍️ getUserIdentity starts')
	// There is no personal info page on the website, so we just show how the identity is supposed to be structured
	const identity = {
		email: ['frodo.baggins@lotrmail.com'],
		name: {
			fullName: 'Frodo Baggins',
			givenName: 'Frodo',
			lastName: 'Baggins'
		},
		address: [
			{
				formattedAddress: "1 Bag-end street 99999 The Shire,
				street: "1 Bag-end street",
				postCode: "99999",
				city: "The Shire"
			}
		],
		phone:[
			{
				type: 'home',
				number: "0423156789"
			},
			{
				type: 'mobile',
				number: "0623451789"
			}
		]
	}
	return identity
}

// Declaration
const connector = new BookToScrapeContentScript()
connector.init({
	additionalExposedMethodsNames: [
		'findValidSAI',
		'getNumberOfPages',
		'getFiles',
		'getUserIdentity'
	]
})
.catch(err => {
log.warn(err)
})
```

And here we are, we have a brand new konnector for books.toscrape.com ready to be released.
