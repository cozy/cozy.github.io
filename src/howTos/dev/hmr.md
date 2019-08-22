---
title: How to use Hot Module Replacement (HMR) with my application?
---

## What is Hot Module Replacement (HMR) ?

As the [Webpack documentation](https://webpack.js.org/concepts/hot-module-replacement/) says:

> Hot Module Replacement (HMR) exchanges, adds, or removes modules while an application is running, without a full reload. This can significantly speed up development in a few ways:
> * Retain application state which is lost during a full reload.
> * Save valuable development time by only updating what's changed.
> * Modifications made to CSS/JS in the source code results in an instant browser update which is almost comparable to changing styles directly in the browser's dev tools.

For a Cozy application, having this feature allows you to have the specific changed part reloaded in your browser without reloading again the `cozy-bar`, the `cozy-client` and other layout components.

_Notice: The HMR will be explained here only for applications build using Webpack._

## Is it available for my app?

If you created your application (React or Vue) using [Create Cozy App a.k.a CCA (from v1)][create-cozy-app] and:

* For React, you didn't change the way [`react-hot-loader`][react-hot-loader] is used
* For Vue, you didn't change the `module.hot` part in your entry point `index.js` (in `src/targets/<target>`)

Then, you dont' have anything to do. See the next part of this tutorial to use HMR 😎

If you did change these parts or you didn't create your application initialy using [Create Cozy App][create-cozy-app], you can see the part [__Make HMR available in my application__](#make-hmr-available-in-my-application).

## Run my app with HMR

To have a full HMR experience, you'll have to do two things here:

* Run webpack watching your changes with a [`webpack-dev-server`][webpack-dev-server] and `--hot` option
* Disable CSPs in the target Cozy (the Cozy CSPs is blocking HMR script)

But thanks to the last version of [`cozy-scripts`][cozy-scripts], all of that are handled for you with the command `cozy-scripts start`:

``` sh
yarn cozy-scripts start --hot --browser
# or if you have the last package.json from CCA, you can do
yarn start
```

### How can I run my webpack and my stack in different terminals?

First, you can pass an option to disable the stack handling by the `start` command:

``` sh
yarn cozy-scripts start --hot --browser --no-stack
# or if you have the last package.json from CCA, you can do
yarn start --no-stack
```

Then, as said, to have your application running in a Cozy with HMR, your have to disable CSPs when running the stack. For that, [`cozy-scripts`][cozy-scripts] has a dedicated config file to pass to your Docker image in `cozy-scripts/stack/disableCSP.yaml`.
You can use this config by running your stack in another terminal like:

```sh
# in your app root directory
docker run --rm -it
  -p 8080:8080 -p 5984:5984
  -v \"$(pwd)/build\":/data/cozy-app/app
  -v \"$(pwd)/node_modules/cozy-scripts/stack/disableCSP.yaml\":/etc/cozy/cozy.yaml
  cozy/cozy-app-dev
```

## Make HMR available in my application

### For a React application

You have to use [`react-hot-loader`][react-hot-loader] inside your main App component like this:

```js
import React from 'react'
import { hot } from 'react-hot-loader'

const App = () => (
  ...
)

export default hot(module)(App)
```

That's it. Then, just use the last version of cozy-scripts to run your application with HMR.

### For a Vue application

Inside your entry point `index.js` (in `src/targets/<target>`), you have to add this part related to `module.hot`:

```js
import Vue from 'vue'
import store from 'lib/store'

const renderApp = function() {
  const App = require('components/App').default
  return new Vue({
    store, // inject store to all children
    el: '[role=application]',
    render: h => h(App)
  })
}

if (module.hot) {
  module.hot.accept('components/App', function() {
    renderApp()
  })
}
```

That's it. Then, just use the last version of cozy-scripts to [run your application with HMR](#run-my-application-with-hmr).

[create-cozy-app]: https://github.com/cozy/create-cozy-app
[cozy-scripts]: https://github.com/cozy/create-cozy-app/tree/master/packages/cozy-scripts
[react-hot-loader]: https://github.com/gaearon/react-hot-loader
[webpack-dev-server]: https://github.com/webpack/webpack-dev-server
