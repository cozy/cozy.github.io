# How to create a mobile application with Cordova

## Install and setup cordova

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

## Configure your build tool

If you use a build tool to transpile your JavaScript code, you need to configure your tool to output the build into `www/`.

### webpack configuration

As [Webpack is the most used build tool](http://stateofjs.com/2016/buildtools/) we will show you how to configure it with cordova:

Create a `webpack.config.js` on the root folder of your project with:

```js
const path = require('path);

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

## Cordova

### Android Platform

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

### iOS development

For building an iOS app, you need [xcode](https://developer.apple.com/xcode/).

[[more to come]]

See further details on [the cordova official documentation about iOS](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html).
