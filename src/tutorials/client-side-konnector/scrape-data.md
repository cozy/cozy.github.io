In this part, we are going to see how to scrape data from the service you want to retrieve your data from. If not done yet, you want to check the [getting started guide](./getting-started.md). 

## Implement your konnector

There are three steps for a konnector to save data to [Cozy Stack][]:

1. Authentication
2. Scrap and/or request data
3. Parse and format data
4. Save data to cozy stack

In a _client-side connector_ this is mainly represented by the following three functions called by the [ContentScript.js](https://github.com/cozy/cozy-react-native/blob/master/connectors/connectorLibs/ContentScript.js) each and every time the konnector is triggered.

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
> As explicite as the name can be, the `Pilot` treat with the cozy-stack, the `Worker` interact with the webservice and send informations to the `Pilot`.
> Both access the ContentScript.js methods,but some methods are design to be restricted (like `runInWorker`, only usable in the `Pilot`) but we'll come to that in details during this tutorial.

___

### Authentication

Open the `src/index.js` file, there are comments to guide you through it.
The very first step is to be able to define if the user is authenticated to the remote service, this is done with:


```javascript
async ensureAuthenticated() {}
```

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
At this point, you got tell the `Pilot` to set the `Worker` on the wanted web page (baseUrl), to be sure the page is loaded properly, you need to wait for an HTML element (here, let's say it is the button leading you to the quotes page).

```javascript
async ensureAuthenticated() {
    await this.goto(baseUrl) // Set the worker on the baseUrl
    await this.waitForElementInWorker(defaultSelector) // Wait for quotes link element in the worker
  }
```

Once `waitForElementInWorker` will respond, you try to click on this button and wait for another element telling you the page is loaded, here we are waiting for either a button to a login page or the logout button.

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

When one of them is true, you need to check if the user is already logged in or not, if not, we trigger the `showLoginFormAndWaitForAuthentication` function.

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

The `showLoginFormAndWaitForAuthentication` function will remains at least like this : 

```javascript
async showLoginFormAndWaitForAuthentication() {
    await this.setWorkerState({ visible: true }) // Show the webview to the user
    await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' }) // Wait for user to connect
    await this.setWorkerState({ visible: false }) // Hide the webview to the user
  }
```
You can always add more actions to it if you need so, but those three are mandatory.

- First will show to the user the `Worker` webview.
- Second will actually wait for the user manual authentication. This will trigger `waitForAuthenticated` wich wait for `checkAuthenticated` to return true from the worker (more about it in an instant). This allows us to bypass eventual captcha or anti-bot securities. 
- Last will hide the `Worker` webview from the user befor continuing execution.

```javascript
async showLoginFormAndWaitForAuthentication() {
    log.debug('showLoginFormAndWaitForAuthentication start') // You can add some logs of course
    await this.clickAndWait(loginLinkSelector, '#username') // Or an action before or after . Here we clicking on the loginPage element and wait for the username input of the form
    await this.setWorkerState({ visible: true })
    await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' })
    await this.setWorkerState({ visible: false })
  }
```
`checkAuthenticated` is a `ContentScript.js` methods that you need to customize and it needs to return true at some point. This is a check to determine if the user login had been successful or not and as it is launched with `runInWorkerUntilTrue`, it will run again and again until ... well, until it respond `true` !

```javascript
async checkAuthenticated() {
    if(document.querySelector(logoutLinkSelector)){ 
      this.log('Auth Check succeeded')
      return true
    }
    return false
  }

```
In the bloc example above, if we find de logoutLink selector, it means the user is actually connected, so the function might return `true`.
___