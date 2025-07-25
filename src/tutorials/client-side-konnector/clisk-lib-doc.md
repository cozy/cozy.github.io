# CliSK library (cozy-clisk)

The CliSK library is designed specifically to facilitate communication between the content script (what's injected in the webview to navigate or manipulate the page) and the launcher for CliSK konnectors. It provides essential tools for both sides of the interaction.

#### Installation

Nothing to do here, if you are starting your CliSK development with the `template_ccc`, everything is ready to go, simply ensure that you have run `yarn` to install all needed dependencies for your project.

#### Module structure

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
