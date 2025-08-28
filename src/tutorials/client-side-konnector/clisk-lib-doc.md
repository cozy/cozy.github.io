# CliSK library (cozy-clisk)

The CliSK library is designed specifically to facilitate communication between the content script (what's injected in the webview to navigate or manipulate the page) and the launcher for CliSK konnectors. It provides essential tools for both sides of the interaction.

### Installation

Nothing to do here, if you are starting your CliSK development with the `template_ccc`, everything is ready to go, simply ensure that you have run `yarn` to install all needed dependencies for your project.

### Module structure

##### Contentscript

The role of this module ist to run inside the browser context, typically injected into the web pages. It provides utilities for :

- interacting with the DOM (extracting or manipulating data)
- detecting when page is fully loaded
- serializing data or errors
- sending message to the launcher

It's main responsibility is to enable browser-side scripts to communicate reliably with the konnector's backend.

It is used to scrape the web pages, extract data or report client-side errors to the launcher.

##### Launcher

The role of the launcher is to listen for messages from the `contentscript` and decide how to process them (e.g. store, parse, trigger workflows ...)

It's main responsibility is to handle incoming message from the browser and orchestrate the konnector's execution

On a typical use case it will receive invoices or files data extracted by the `contentscript` and upload them to the cozy instance.

##### Bridge

The role of this module is to handle underlying communication logic between the `contentscript` and the `launcher` . It abstract message passing, serialisation, error handling etc ...

It's main responsibility is to provide an API for message exchange between the browser the Twake App, while managing all the low-level logic under the hood.

It's typical use case is to send a structured request from the browser context and wait for a response from the backend or vice versa.

---

### Exposed methods

> Each function in this part is designed to be executed inside the konnector sandbox.

#### onWorkerReady()

**Description**  
Called automatically when the worker page is fully loaded and ready.  
This is the right place to **initialize logic tied to the page lifecycle**, such as subscribing to DOM events.

**Key points**

- Runs **after each worker reload**.
- Useful for **binding events** that must persist across reloads.
- Does **not receive parameters**.

**Example**

```javascript
onWorkerReady() {
  // Example: re-attach a click listener every time the page reloads
  document.querySelector("#login-btn")?.addEventListener("click", () => {
      this.log('info', "Login button clicked!");
    const login = document.querySelector('#login')?.value
    const password = document.querySelector('#password')?.value
    this.bridge.emit('workerEvent', {
            event: 'loginSubmit',
            payload: { login, password }
          })
  });
}
```

#### onWorkerEvent()

**Description**  
Called on the **pilot side** whenever the worker sends `workerEvent` messages through the bridge.  
Use this method to **listen and react** to events emitted by the worker.

**Key points**

- Triggered only when the worker explicitly emits a `workerEvent`.
- Runs in the **pilot context**, not inside the worker.
- Useful for **synchronizing state** or **forwarding events** to other parts of the app.

**Example**

```javascript
onWorkerEvent({event, payload}) {
  // Example: handle a login submit event sent by the worker
  if (event === "loginSubmit") {
    this.log('info', `Login submit sent with payload : ${payload}`)
  }
}
```

#### checkAuthenticated()

**Description**  
Checks if the user is currently authenticated.  
This method is designed to be **overridden by child classes** to implement custom authentication logic.

**Context**  
Worker

**Key points**

- Returns a **Promise<boolean>**.
- Default implementation always returns `false`.
- Should be overridden to perform actual authentication checks (e.g., session, token validity).

**Example**

```javascript
async checkAuthenticated() {
  // Example : check if logout button is present (e.g. meaning the user is logged)
  return Boolean(document.querySelector('#logout-btn'));
}

```

#### waitForAuthenticated(options = {})

**Description**  
Waits until the user is authenticated.  
Internally, it repeatedly calls `checkAuthenticated()` until it resolves as `true` or the timeout is reached.

**Context**  
Worker

**Key points**

- Returns a **Promise<true>** when the user is authenticated.
- Accepts an `options` object:
  - `timeout` (ms) → max time before failing (default: 5 minutes).
  - `interval` (ms) → delay between checks (default: 1 second).
- Throws a **TimeoutError** if the timeout expires.
- Relies on the `checkAuthenticated()` implementation of the child class.

**Example**

```javascript
// Call this method with `runInWorkerUntilTrue
await this.runInWorkerUntilTrue({ method: "waitForAuthenticated", { timeout: 30000, interval: 500 } });
```

#### waitForDomReady()

**Description**  
Resolves when the DOM is ready (fires after the `DOMContentLoaded` event).  
Ensures that the page structure is fully available before interacting with elements. It is usually used in the `onWorkerReady` to wait for for the DOM to fully load before trying to tie a listener or check for an element.

**Context**  
Worker

**Key points**

- Returns a **Promise<void>**.
- Resolves immediately if the DOM is already ready.
- Times out after **10s** if no `DOMContentLoaded` is detected.
- Logs a warning if the timeout occurs.

**Example**

```javascript
// Example: wait for DOM to be ready before selecting elements
await this.waitForDomReady();
```

#### waitForNotAuthenticated(options = {})

**Description**  
Waits until the user is **not authenticated**.  
Internally, it repeatedly calls `checkAuthenticated()` until it resolves as `false` or the timeout is reached.

**Context**  
Worker

**Key points**

- Returns a **Promise<true>** when the user is no longer authenticated.
- Accepts an `options` object:
  - `timeout` (ms) → max time before failing (default: 30s).
  - `interval` (ms) → delay between checks (default: 1s).
- Throws a **TimeoutError** if the timeout expires.
- Useful to detect logout or expired sessions.

**Example**

```javascript
// Example: wait up to 10s for the user to be logged out
await this.runInWorkerUntilTrue({
  method: "waitForNotAuthenticated",
  timeout: 30000,
  interval: 500,
});
```

#### waitForRequestInterception(identifier, options = {})

**Description**  
Waits for a **specific network request** (identified by a string) to be intercepted.  
The identifier must match one defined in the `RequestInterceptor` passed to the `ContentScript` constructor.

**Context**  
Pilot

**Key points**

- Returns a **Promise<payload>** resolving with the intercepted request payload.
- Accepts an `options` object:
  - `timeout` (ms) → max wait before failing (default: 60s).
- Throws an error if no bridge is defined.
- Useful to synchronize logic with specific network requests.

**Example**

```javascript
// Example: wait up to 15s for the login request to be intercepted
const response = await this.waitForRequestInterception("loginRequest", {
  timeout: 15000,
});
```

#### runInWorker(method, ...args)

**Description**  
Runs a specified method inside the **worker webview** from the pilot.  
Allows the pilot to remotely trigger worker-side functions.

**Context**  
Pilot

**Key points**

- Returns a **Promise<any>** resolving with the result of the worker method.
- Requires a valid `bridge` (initialized with `ContentScript.init`).
- Throws an error if the bridge is not defined.
- Useful for delegating tasks to the worker without direct DOM access.

**Example**

```javascript
// Example: call worker method "checkAuthenticated" from the pilot
const isAuth = await this.runInWorker("checkAuthenticated");
```

#### runInWorkerUntilTrue(options)

**Description**  
Continuously runs a specified worker method from the pilot until it resolves as `true`, or until the timeout expires.

**Context**  
Pilot

**Key points**

- Returns a **Promise<boolean>** resolving to `true`.
- Accepts an `options` object:
  - `method` (**string**) → name of the worker method to call.
  - `timeout` (**number**) → max time before failing (default: Infinity).
  - `suffix` (**string**) → extra info for the timeout error message.
  - `args` (**Array**) → arguments passed to the worker method.
- Throws a **TimeoutError** if the timeout is reached.
- Useful for **polling a worker method until a condition is met**.

**Example**

```javascript
// Example: wait up to 10s until the worker reports user is authenticated
await this.runInWorkerUntilTrue({
  method: "checkAuthenticated",
  timeout: 10000,
});
```

#### waitForElementInWorker(selector, options = {})

**Description**  
Waits for a DOM element (matching a CSS selector) to be present inside the worker page.  
Works even across page reloads or redirects.

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>** once the element is found.
- Accepts:
  - `selector` (**string**) → CSS selector to locate the element.
  - `options.timeout` (**number**) → max wait time in ms (default: 30s).
  - `options.includesText` (**string**) → restrict match to elements containing this text.
- Relies on the worker method `waitForElementNoReload`.
- Useful for ensuring UI elements exist before interacting with them.
- Selectors can be chained comma-separated to wait for multiple elements. First found will resolve

**Example**

```javascript
// Example: wait up to 10s for the login button to appear in the worker
await this.waitForElementInWorker("#login-btn", {
  timeout: 10000,
  includesText: "Se connecter",
});

// Chained selectors example :
await this.waitForElementInWorker("#login-btn, #logout-btn, #homePage");
```

#### isElementInWorker(selector, options = {})

**Description**  
Checks if a DOM element (matching a CSS selector) is present in the worker page.

**Context**  
Pilot

**Key points**

- Returns a **Promise<boolean>** → `true` if the element exists, `false` otherwise.
- Accepts:
  - `selector` (**string**) → CSS selector of the element to check.
  - `options` (**object**) → additional options passed to the worker method.
- Uses the worker method `checkForElement`.
- Unlike `waitForElementInWorker()`, this function will not wait for the element to appear.

**Example**

```javascript
// Example: check if logout button is currently present in the worker
const exists = await this.isElementInWorker("#logout-btn");
```

#### waitForElementNoReload(selector, options = {})

**Description**  
Waits for a DOM element (matching a CSS selector) to be present in the worker page.  
⚠️ Unlike `waitForElementInWorker`, this will **not resolve if the page reloads**.

**Context**  
Worker

**Key points**

- Returns a **Promise<true>** when the element is found.
- Accepts:
  - `selector` (**string**) → CSS selector of the element.
  - `options.includesText` (**string**) → restrict match to elements containing this text.
- Default timeout: 30s.
- Suitable when the page is stable (no reloads expected).

**Example**

```javascript
// Example: wait for the login form (without handling reloads)
await this.waitForElementNoReload("#login-form", { includesText: "Sign in" });
```

#### checkForElement(selector, options = {})

**Description**  
Checks if a DOM element (matching a CSS selector) is present in the worker page.

**Context**  
Worker

**Key points**

- Returns a **Promise<boolean>** → `true` if the element exists, `false` otherwise.
- Accepts:
  - `selector` (**string**) → CSS selector of the element.
  - `options.includesText` (**string**) → restrict match to elements containing this text.
- Uses `selectElement()` internally to find the element.
- Non-blocking: does not wait, just checks immediately.

**Example**

```javascript
// Example: check if the logout button is present right now
const isPresent = await this.checkForElement("#logout-btn");
```

#### selectElement(selector, options = {})

**Description**  
Selects a DOM element in the worker page using a CSS selector and optional text filtering.

**Context**  
Worker

**Key points**

- Returns the **DOM element** if found, otherwise `null`.
- Accepts:
  - `selector` (**string**) → CSS selector of the element.
  - `options.includesText` (**string**) → restrict to elements whose `innerHTML` contains this text.
- Uses `document.querySelector()` or `document.querySelectorAll()` internally.
- Does **not wait** for the element — use `waitForElementNoReload()` if waiting is needed.

**Example**

```javascript
// Example: select a button containing the text "Submit"
const button = this.selectElement("button", { includesText: "Submit" });
```

#### click(selector, options = {})

**Description**  
Clicks on a DOM element in the worker page, identified by a CSS selector and optional text filter.

**Context**  
Worker

**Key points**

- Returns a **Promise<void>**.
- Accepts:
  - `selector` (**string**) → CSS selector of the element to click.
  - `options.includesText` (**string**) → restrict to elements whose `innerHTML` contains this text.
- Uses `selectElement()` to locate the element.
- Throws an error if no element matches the selector.

**Example**

```javascript
// Example: click the login button
// From worker context :
await this.click("button", { includesText: "Sign in" });

// Example using this function from pilot context
await this.runInWorker("click", "#logout-btn");
```

#### clickAndWait(elementToClick, elementToWait)

**Description**  
Clicks on a DOM element inside the worker, then waits until another element is displayed.  
Useful for actions that trigger navigation or UI changes.

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>**.
- Accepts:
  - `elementToClick` (**string**) → CSS selector of the element to click.
  - `elementToWait` (**string**) → CSS selector of the element to wait for.
- Delegates the click to the worker (`runInWorker('click')`).
- Uses `waitForElementInWorker()` to ensure the next element is visible.
- Suitable for login flows or navigation steps.

**Example**

```javascript
// Example: click login button and wait for dashboard element to load

await this.clickAndWait("#login-btn", "#dashboard");
```

#### fillText(selector, text)

**Description**  
Fills a text input (or similar element) inside the worker page with the given value, and triggers the proper DOM events.

**Context**  
Worker

**Key points**

- Returns a **Promise<void>**.
- Accepts:
  - `selector` (**string**) → CSS selector of the input element.
  - `text` (**string**) → text value to insert.
- Uses `selectElement()` to locate the element.
- Throws an error if no element matches the selector.
- Dispatches both `input` and `change` events after setting the value (to simulate real typing).

**Example**

```javascript
// Example: fill the username field

// From worker context :
await this.fillText("#username", login);

// From pilot context :
await this.runInWorker("fillText", "#username", login);
```

#### downloadFileInWorker(entry)

**Description**  
Downloads a file from a given URL inside the worker context.  
The file is fetched, converted to a `Blob`, and then encoded as a Base64 data URI.

**Context**  
Worker

**Key points**

- Called by default by the pilot when using `saveFiles`.
- Can be overwritten in the konnector's code to fit the targeted website's file download flow (like double requests for example).
- Returns a **Promise<string>** → Base64-encoded data URI of the file.
- Accepts:
  - `entry.fileurl` (**string**) → URL of the file to download.
  - `entry.requestOptions` (**object**, optional) → options passed to the HTTP request.
- On success:
  - Adds `entry.blob` (file as `Blob`).
  - Adds `entry.dataUri` (Base64 string).
- On failure:
  - Logs the error with details.
  - Throws `VENDOR_DOWN` for known HTTP errors (`401`, `403`, `404`, `500`, `502`, `503`).
  - Throws `UNKNOWN_ERROR` otherwise.

**Example**

```javascript
// Example: download a PDF and get it as base64 string
const base64File = await this.downloadFileInWorker({
  fileurl: "https://example.com/document.pdf",
  requestOptions: { headers: { Authorization: "Bearer token" } },
});
```

#### saveFiles(entries, options)

**Description**  
Bridge to the launcher's `saveFiles`.  
It filters and prepares file entries, downloads files when needed, converts blobs to Base64 URIs, then forwards everything to the launcher.

**Context**  
Pilot

**Key points**

- Returns a **Promise<any>** with the launcher's result (e.g. the saved files, if no errors).
- Requires a valid `bridge` (`ContentScript.init`).
- Uses `prepareSaveFileEntries()` internally.
- `options.context` is required.
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: save bunch of files with fileIdAttributes, contentType and qualification label
await this.saveFiles(selectedDocuments, {
  context,
  fileIdAttributes: ["vendorId"],
  contentType: "application/pdf",
  qualificationLabel: "pay_sheet",
});
```

#### getCredentials()

**Description**  
Bridge to the launcher's `getCredentials` method.  
Used to retrieve stored credentials from the mobile keychain.

**Context**  
Pilot

**Key points**

- Returns a **Promise<object>** with the stored credentials.
- Requires a valid `bridge` (initialized with `ContentScript.init`).
- Throws an error if no bridge is defined.
- Typically used before performing authenticated actions.

**Example**

```javascript
// Example: retrieve credentials from the launcher
const creds = await this.getCredentials();
this.log("info", `Retrived credentials : ${JSON.stringify(creds)}`);
```

#### saveCredentials(credentials)

**Description**  
Bridge to the launcher's `saveCredentials`.  
Stores credentials for the current konnector through the pilot into the mobile keychain.

**Context**  
Pilot

**Key points**

- Returns a **Promise<any>** once credentials are saved.
- Requires a valid `bridge` (`ContentScript.init`).
- `credentials` must be an object.
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: save user credentials
await this.saveCredentials({ username: login, password: password });
```

#### saveIdentity(identity)

**Description**  
Bridge to the launcher's `saveIdentity`.  
Saves a user identity (as an `io.cozy.contacts` object) through the pilot.

**Context**  
Pilot

**Key points**

- Returns a **Promise<any>** once the identity is saved.
- Requires a valid `bridge` (`ContentScript.init`).
- `identity` must be a valid `io.cozy.contacts` object.
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: save a contact identity
await this.saveIdentity({
  contact: userIdentity,
});
```

#### setWorkerState(options = {})

**Description**  
Proxy to the launcher's `setWorkerState` command.  
Updates the worker webview state (e.g., displayed URL or visibility).

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>**.
- Requires a valid `bridge` (`ContentScript.init`).
- `options` can include:
  - `url` (**string**) → URL to display in the worker webview.
  - `visible` (**boolean**) → whether the worker should be visible.
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: open the login page in the worker and make it visible
await this.setWorkerState({ url: "https://example.com/login", visible: true });
```

#### goto(url)

**Description**  
Sets the current URL of the worker webview.  
This is a shortcut to `setWorkerState({ url })`.

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>**.
- Accepts:
  - `url` (**string**) → the URL to load in the worker.
- Internally calls `setWorkerState()`.

**Example**

```javascript
// Example: navigate the worker to the homepage
await this.goto("https://example.com/home");
```

#### blockWorkerInteractions()

**Description**  
Blocks user interactions with the worker webview.  
Useful to prevent manual interference during automated steps.

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>**.
- Requires a valid `bridge` (`ContentScript.init`).
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: temporarily block interactions while processing
await this.blockWorkerInteractions();
```

#### unblockWorkerInteractions()

**Description**  
Unblocks user interactions with the worker webview.  
Restores normal user access after being blocked.

**Context**  
Pilot

**Key points**

- Returns a **Promise<void>**.
- Requires a valid `bridge` (`ContentScript.init`).
- Throws an error if the bridge is not available.

**Example**

```javascript
// Example: re-enable interactions after an automated login step
await this.unblockWorkerInteractions();
```

#### evaluateInWorker(fn, ...args)

**Description**  
Evaluates a given function directly inside the worker context.  
Useful for executing custom logic or DOM queries from the pilot.

**Context**  
Pilot

**Key points**

- Returns a **Promise<any>** with the result of the evaluated function.
- Accepts:
  - `fn` (**Function**) → the function to run in the worker.
  - `...args` → arguments passed to the function.
- Internally calls `runInWorker('evaluate', fn.toString(), ...args)`.

**Example**

```javascript
// Example: get the page title from the worker
const title = await this.evaluateInWorker(() => document.title);
```

#### evaluate(fnString, ...args)

**Description**  
Evaluates a given function string inside the worker context.  
Allows the pilot to send serialized functions for execution.

**Context**  
Worker

**Key points**

- Returns a **Promise<any>** with the result of the evaluation.
- Accepts:
  - `fnString` (**string**) → function body as a string.
  - `...args` → arguments passed to the function.
- Internally uses `callStringFunction()` to execute the function string.

**Example**

```javascript
// Example: evaluate a function string that gets the page URL
const url = await this.evaluate("() => document.location.href");
```

> Note :
> This is never used as is, prefer using the `evaluateInWorker` function

#### ensureAuthenticated()

**Description**  
Ensures the konnector is authenticated to the target website.  
In CliSK, this method is **automatically executed as part of the standard flow** and is **meant to be overridden** to match the target site (e.g., show login webview, perform steps, verify session).

**Context**  
Worker

**Key points**

- Returns a **Promise<boolean>** → `true` if authenticated.
- Default implementation returns `true` (stub).
- **Always override** to implement the real login flow for the target website.
- Should coordinate with `checkAuthenticated()` and waiting helpers.
- Throw `LOGIN_FAILED` if authentication cannot be completed.

**Example**

```javascript
// Example: minimal override using the standard flow
async ensureAuthenticated() {
    await this.goto("https://example.com/home");
    await this.waitForElementInWorker('#logout-btn, #email')
    if (await this.checkAuthenticated()) return true;
    // Open login page and perform login steps
    await this.runInWorker('click', '#loginPageLink');
    await this.waitForelementInWorker('#email')
    await this.runInWorker('fillText','#email', credentials.username);
    await this.runInWorker('fillText','#password', credentials.password);
    await this.runInWorker('click', '#submit');

    // Wait until authenticated
    await this.runInWorkerUntilTrue({ method: 'waitForAuthenticated' })
    const auth = await this.runInWorker('checkAuthenticated')
    if (!auth){
    throw new Error('LOGIN_FAILED');
    }

    return true;
}

```

#### ensureNotAuthenticated()

**Description**  
Ensures the konnector is **not authenticated** to the target website.  
Unlike `ensureAuthenticated()`, this method is **not called automatically in the standard flow**, but it should still be **overridden if used** (e.g., when a konnector explicitly needs to log the user out).

**Context**  
Worker

**Key points**

- Returns a **Promise<boolean>** → `true` if the user is not authenticated.
- Default implementation always returns `true` (stub).
- **Override if needed** to implement real logout / session reset logic.
- Typically works together with `checkAuthenticated()` and `waitForNotAuthenticated()`.

**Example**

```javascript
// Example: minimal override for a logout step
async ensureNotAuthenticated() {
  if (!(await this.checkAuthenticated())) return true;

  await this.click('#logout');
  const ok = await this.waitForNotAuthenticated({ timeout: 10000 });
  return ok;
}
```

#### getUserDataFromWebsite()

**Description**  
Fetches unique information about the authenticated user from the target website.  
This method is **automatically executed in the standard CliSK flow** and must be **overridden** to return identifying data called `sourceAccountIdentifier`. It could be fetched with different methods (scraping, storage, request interception ...).It will be the name of the registered account in the instance and will name the main folder where files will be saved.

**Context**  
Pilot

**Key points**

- Returns a **Promise<object>** with user-specific information.
- Default implementation is empty (stub).
- **Always override** to extract meaningful identifiers (e.g., username, account ID, profile details).
- Data returned here is often used to organize or label fetched data.

**Example**

```javascript
// Example: override to return account-specific metadata
async getUserDataFromWebsite() {
    const sourceAccountIdentifier = await this.runInWorker('getUserData')
    return {
        sourceAccountIdentifier
    }
  }
```

#### sendToPilot(obj)

**Description**  
Sends arbitrary data from the worker to the pilot so it can be stored in the pilot’s own store.

**Context**  
Worker

**Key points**

- Returns a **Promise<any>** (result of the pilot handler).
- Requires a valid `bridge` (`ContentScript.init`).
- Throws an error if the bridge is not available.
- Useful for sharing intermediate data or telemetry from the worker.

**Example**

```javascript
// Example: send an scraped identity to the pilot store
await this.sendToPilot({ userIdentity });

// Then you can fetch them in the pilot :
const userIdentity = this.store.userIdentity;
```

#### shouldFullSync(options)

**Description**  
Determines whether the konnector should perform a **full synchronization** or just a partial/quick sync.

**Context**  
Pilot

**Key points**

- Returns a **Promise<object>** with:
  - `forceFullSync` (**boolean**) → `true` if a full sync is required.
  - `distanceInDays` (**number|NaN**) → days since last execution (or `NaN` if not applicable).
- Logic is based on:
  - Execution flags (e.g., `clisk.force-full-sync`).
  - konnector state (`trigger.current_state`).
  - Errors in previous jobs.
  - Age of the last execution (≥ 30 days triggers full sync).
- Ready to use — just call it to decide which sync strategy to follow.

**Example**

```javascript
// Example: use shouldFullSync to choose between sync strategies
const { forceFullSync, distanceInDays } = await this.shouldFullSync(context);

if (forceFullSync) {
  await this.fullSync();
} else {
  await this.quickSync(distanceInDays);
}
```

#### fetch(options)

**Description**  
Main entry point of the konnector.  
Automatically executed in the CliSK flow, it is responsible for fetching all relevant data from the target website and saving it to Cozy.  
This method **must be overridden** in every konnector implementation.

**Context**  
Pilot

**Key points**

- Returns a **Promise<object>** with the connector’s execution result.
- Called automatically by the framework.
- **Always override** to implement the actual data retrieval and saving logic.
- Receives an `options` object containing:
  - `context` → previously fetched data, useful to avoid duplicates and optimize execution.

**Example**

```javascript
// Example: minimal override of fetch()
async fetch({ context }) {
    await this.navigateToBillsPage()
    const data = await this.runInWorker("scrapeInvoices");
    await this.navigateUserInfosPage()
    const userIdentity = await this.getUserIdentity()
    await this.saveFiles(data, { context });
    await this.saveIdentity(userIdentity)
    this.log('info', 'Execution finished !')
}
```
