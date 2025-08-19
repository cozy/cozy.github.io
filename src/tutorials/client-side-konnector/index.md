Twake supports two types of konnectors: **server-side** and **client-side**.

Server-side konnectors run on the Twake stack, can be scheduled, and work without user interaction, but are limited by captchas and strong authentication mechanisms.

Client-side konnectors (CliSK) is using a webview to simulate a browser into the Twake mobile App. It's allowing the developer to interact directly on the website via a script or by giving back the control to the user when needed. Very useful to bypass bot detection by inducing a real human interaction on the website on sensible phases such as login, 2FA or any type of captcha.

A Client-Side Konnector (also known as _CliSK_) contains a script that imports data from another web service and put those data into your cozy.
Each connector is an independent application, managed by the [Twake Home][] application.

To protect your data, each connector runs inside a container in order to sandbox all their interactions with your data.

> ⚠️ For historical reasons, in the Twake codebase, a twake connector is named "konnector", please follow this convention if modifying an existing application.

In this tutorial you will learn how to:

- [Install the development environnement](./installation.md)
- [Create your first CliSK](./clisk-creation.md)
- [Understand how cozy-clisk library works](./clisk-lib-doc.md)
- [Troubleshoot common issues with CliSK](./troubleshooting.md)
- [Code with Twake's best practices](./best-practice.md)
- [Contribute to any other existing CliSK](./contributions.md)
- [Join the Twake's community](./community.md)

---

### CliSK architecture

#### How does it work?

A CliSK konnector runs inside two **separated webviews** that communicate with each other:

- One called **`pilot`**
- Another called **`worker`**

These two roles are essential to understand before building your konnector.

---

##### Pilot

The **pilot webview** is the coordinator.  
It ensures communication between the `worker` (the one navigating websites) and the **Twake mobile app**.

Its responsibilities are:

- Controlling the `worker`’s actions (navigate, click, scrape, etc.)
- Collecting results from the `worker` and returning them to the app
- Maintaining the current execution state (progress, errors, retries)

Think of it as the **control tower** of your konnector.

---

##### Worker

The **worker webview** acts as a **lightweight browser**.  
It executes the real job of the konnector by:

- Opening web pages
- Interacting with the website
- Scraping or extracting content
- Intercepting network requests

At the end, it sends all collected data back to the `pilot`.  
This is also the webview you will mostly **see and debug** during development.

---

##### Store

The **store** is a temporary data storage.  
It is useful to keep:

- HTTP responses with relevant information
- Scraped values you will reuse later in the flow
- Intermediate states of the execution

It acts like a **shared memory** between the different steps of your konnector.

---

##### Library

All CliSK konnectors rely on the [**cozy-clisk**](https://github.com/konnectors/libs/tree/master/packages/cozy-clisk) library.  
This library provides the base tools to:

- Manage communication between `pilot` and `worker`
- Handle credentials and authentication
- Simplify scraping and data handling

We will cover it in detail in a [dedicated documentation](./clisk-lib-doc.md).

[Twake Home]: https://github.com/cozy/cozy-home
