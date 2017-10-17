# How to create a mobile Cozy application

The simplest way to create a mobile Cozy application is to use JavaScript as there already are JavaScript libraries to connect to the Cozy server, as known as cozy-stack.

Therefore we will use the classical stack:

1. a JavaScript web application
1. and cordova

!!! warning ""
    [At the end of this documentation](#annexes), you will find _how-tos_ to help you with [cordova configuration](#install-and-setup-cordova), [webpack builds](#webpack-configuration) and [cordova deployments for Android and iOS](#cordova).

To create [your first Cozy application](/dev/app), just follow the guide.
As you can read there, Cozy applications are served by the Cozy server, this is the way that Cozy applications retrieve a token to query data.

In the case of a mobile application, you need to retrieve a token differently. Hopefully we provide everything you need to do it easily.

You'll need two libraries:

- cozy-client-js ([source](https://github.com/cozy/cozy-client-js))
- cozy-bar ([source](https://github.com/cozy/cozy-bar))

!!! warning ""
    In the case of Cozy web applications served by the Cozy server, these two libraries are injected in the html file with variables `{{.CozyClientJS}}` and `{{.CozyBar}}`.

## Connect to Cozy server

When an user will start your mobile Cozy application, she/he will need to point to her/his server url to ask for permissions for her/his device.

This is done by our library `cozy-client-js`, you just need to add a HTML form:

```html
<form id="form">
  <label>What is your cozy server url?
    <input name="url" id="url" type="text" />
  </label>
  <button type="submit">Submit</button>
</form>
```

```js
const urlInput = document.getElementById("url");
const form = document.getElementById("form");
form.addEventListener("submit", registerClient);
function registerClient (event) {
  event.preventDefault();
  const url = urlInput.value;
  const { client, token } = await cozyClient.register(url);
  // do whatever you need with client and token like persist
}
```

<a class="jsbin-embed" href="http://jsbin.com/nokoxak/embed?console,output">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?4.1.0"></script>

When `cozyClient.register(url)` is called, [the cordova inapp browser plugin](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-inappbrowser/) is used to display a password request and a permission acceptation page to let the end-user to register her/his device.

That's all!

Then you can use the cozy-client-js library as [you would within a classic Cozy application](/dev/app/#manipulating-documents).

## Initialize the Cozy bar

The Cozy bar needs some information to be initialized and, as cozy-client-js its initialization must be done in your front-end code:

```js
cozy.bar.init({
  appName: "App Name",
  appEditor: "Editor Name",
  iconPath: require("./assets/app-icon.svg"),
  lang: "en-US",
  replaceTitleOnMobile: true
})
```

## Use Cordova

### Install and setup cordova

[Cordova is a tool](http://blog.ionic.io/what-is-cordova-phonegap/) to build Android and iOS applications from a web app.

It works with a CLI that needs [node](https://nodejs.org/en/download/).
Look at the [cordova documentation to install everything needed](https://cordova.apache.org/docs/en/latest/guide/cli/index.html#installing-the-cordova-cli).

Once cordova is installed, just run `cordova create cozy-app com.example.cozyapp CozyApp` and you get the following structure: 

```bash
./
├── config.xml
├── hooks
│   └── README.md
├── platforms
├── plugins
└── www
    ├── css
    │   └── index.css
    ├── img
    │   └── logo.png
    ├── index.html
    └── js
        └── index.js

7 directories, 6 files
```

__Note:__ everything you put in `www/` will be served as your application content.

### Configure your build tool

If you use a build tool to transpile your JavaScript code, you need to configure your tool to output the build into `www/`.

#### webpack configuration

As [Webpack is the most used build tool](http://stateofjs.com/2016/buildtools/) we will show you how to configure it with cordova:

Create a `webpack.config.js` on the root folder of your project with:

```js
const path = require('path');

module.exports = {
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path.resolve(__dirname, 'www')
  }
}
```

And add the output bundle in the `www/index.html` file:

```html
<html>
  <head>
    ...
  </head>
  <body>
    ...
    <script src="bundle.js"></script>
  </body>
</html>
```

See [the official webpack documentation](https://webpack.js.org/) for more details.

### Cordova

#### Android Platform

Use `cordova platform add android` and check your environment with `cordova requirements`:

A bad requirements check:

```
Requirements check results for android:
Java JDK: installed .
Android SDK: installed
Android target: not installed
Android SDK not found. Make sure that it is installed. If it is not at the default location, set the ANDROID_HOME environment variable.
Gradle: installed
Error: Some of requirements check failed
```

A good requirements check:

```
Requirements check results for android:
Java JDK: installed .
Android SDK: installed
Android target: installed android-19,android-21,android-22,android-23,Google Inc.:Google APIs:19,Google Inc.:Google APIs (x86 System Image):19,Google Inc.:Google APIs:23
Gradle: installed
```

See cordova, android and ios documentation to customize your development environment for your special needs.

Once everything is right, you could run `cordova build` and `cordova run android` to create an APK and push the APK on a device.

__Note:__ The device should be connected with usb.
See [official android documentation for more details](https://developer.android.com/studio/run/device.html).

#### iOS development

For building an iOS app, you need [xcode](https://developer.apple.com/xcode/).

[[more to come]]

See further details on [the cordova official documentation about iOS](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html).
