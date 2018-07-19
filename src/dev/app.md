# How to create your first Cozy application


## Prerequisite

Developing an application for Cozy is quite easy. All you need to have is:

 - NodeJS 8+
 - [Yarn](https://yarnpkg.com): a NodeJS package manager, like `npm`
 - Docker to have a Cozy for dev
 - Some basics about developing a single page application in HTML/JS or you just want to learn :)

The only tool required to have a Cozy for development is Docker. We have been told that installing Docker on some familial flavours of Windows may be a bit difficult. If you use Windows, please check if Docker is available on your system.


## Install the development environment

!!! warning ""
    On GNU/Linux, according [to the documentation](https://docs.docker.com/engine/installation/linux/linux-postinstall/): « The docker daemon binds to a Unix socket instead of a TCP port. By default that Unix socket is owned by the user root and other users can only access it using sudo. If you don’t want to use sudo when you use the docker command, create a Unix group called docker and add users to it. Be warned that the docker group grants privileges equivalent to the root user. You should have a look at [Docker’s documentation on security](https://docs.docker.com/engine/security/security/).


Every application running inside Cozy is a client-side HTML5 application interacting with your data through the API of the server. To develop an application, you’ll require a running Cozy server.

The easiest way is to use the Docker image for developers we provide.

Just install it:

```sh
docker pull cozy/cozy-app-dev
```

(We update this image on a regular basis with the latest version of the server and our library. Don’t forget to update the image by running `docker pull cozy/cozy-app-dev` from time to time).

## Create your application

You can boostrap your application from scratch if you want, but we recommand to use our new community tool [`create-cozy-app`](https://github.com/CPatchane/create-cozy-app) to bootstrap very easily a Cozy application for you.

<div align="center">
  <img src="https://github.com/CPatchane/create-cozy-app/blob/master/docs/CCA_logo_wording.png?raw=true" height="150px"/>
</div>

This tool will generate an application using (P\)React, the framework we internally use in the Cozy Front team. But [options](https://github.com/CPatchane/create-cozy-app#options) are available if you want to use other frameworks.

!!! warning ""
    For now the new [`cozy-client`](https://github.com/cozy/cozy-client) is used only in the (P\)React template (it doesn't use the previous `cozy-client-js` anymore). This library is at an early stage but you can use it, it will be our next Cozy client for application development.

First of all, run directly `create-cozy-app` without installing it globally by using the `yarn create cozy-app` command to bootstrap your application:

```
yarn create cozy-app mycozyapp
```

The script will download some dependencies (may take a while) and ask you a few questions, then create an application skeleton inside `mycozyapp`.

That's all! You can start hacking:

```
cd mycozyapp
yarn standalone
```

After the webpack build, your app should be available at http://localhost:8888

> You can change the host and the port of your application server here by using respectively the environment variables DEV_HOST and DEV_PORT

### Run it inside a Cozy using Docker

You can run your application (here `mycozyapp`) inside a Cozy thanks to the [cozy-stack docker image][cozy-stack-docker]:

```sh
# in a terminal, run your app in watch mode
$ cd mycozyapp
$ yarn watch
```

Then, in another terminal:

```sh
# in another terminal, run the docker container
$ yarn stack:docker
# or if you want the complete command (see more documentation below)
$ docker run --rm -it -p 8080:8080 -v "$(pwd)/build":/data/cozy-app/mycozyapp cozy/cozy-app-dev
```

Your app is now available at http://mycozyapp.cozy.tools:8080.

## How is the application working?

The minimal application consist of only two files:

 - an HTML file, `index.html`, with the markup and the code of your application
 - a manifest describing the application. It’s a JSON file named `manifest.webapp` with the name of the application, the permissions it requires… We’ll have a deeper look to it content later.

Your application requires some informations to interact with the server API, for example the URL of its entrypoint, and an auth token. This data will be dynamically injected into `index.html` when it serves the page. So the `index.html` file has to contain some string that will be replaced by the server. The general syntax of this variables is `{{…}}`, so don’t use this syntax for other purpose in the page, for example inside comments.

You can use the following variables:

 - `{{.Domain}}` will be substituted by the URL of the API entrypoint
 - `{{.Token}}` will be replaced by a token that authenticate your application when accessing the API
 - `{{.Locale}}`: the lang f the instance
 - `{{.AppName}}`: the name of the application
 - `{{.IconPath}}` will be replaced by HTML code to display the *favicon*
 - `{{.CozyClientJS}}` will be replaced with HTML code to inject the Cozy client library
 - `{{.CozyBar}}` will be replaced with HTML code to inject the upper menu bar.


## Use the API with cozy-client-js

!!! warning ""
    We are currently working on a new [`cozy-client`](https://github.com/cozy/cozy-client) library which will be more updated and used in the future than `cozy-client-js`. But the two libraries (`cozy-client` and `cozy-client-js`) don't rely on each other so you can still use the one you want to handle Cozy data for now.

If you added `{{.CozyClientJS}}` to your page, interacting with the server will be as easy as using the Cozy Client JS library. All you have to do is to initiate the library with the server parameters (the URL of the API and the auth token of your application):

```js
  window.cozy.client.init({cozyURL: "…", token: "…"});
```

You can then interact with the server by using methods of the `window.cozy.client` properties. For example, to get current disk usage:

```javascript
  cozy.client.settings.diskUsage()
    .then(function (usage) {console.log("Usage (promise)", usage);});
    .catch(function(err){ console.log("fail", err); });
```

This library embeds most of the available server APIs: manipulate documents and files, manage applications and server settings… It also provides some some methods to help application keep working while being offline.

Some server APIs may not be available right now through the library. If you want to use one of this method, you’ll have to call it manually. See below. #TODO - add inner link.


#### Behind the magic

Some server APIs may not be available right now through the library. If you want to use one of this method, you’ll have to call it manually. We’ll describe here how to access the API without using the Cozy Client JS library.

Connecting to the API requires three things:

 - its URL, injected into the page through the `{{.Domain}}` variable
 - the application auth token, injected into the page through the `{{.Token}}` variable. Each request sent to the server must include this token in the `Authorization` header
 - the session cookie, created when you connect to your server. This is an `HttpOnly cookie`, meaning that JavaScript applications can’t read it. This prevent a malicious script to stole the cookie.


Here’s a sample code that get API informations provided by the server and query the API:

```html
    <div data-cozy-token="{{.Token}}" data-cozy-domain="{{.Domain}}" />
```

```javascript
document.addEventListener('DOMContentLoaded', () => {
  "use strict";
  const app = document.querySelector('[data-cozy-token]');
  fetch(`//${app.dataset.cozyDomain}/apps`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${app.dataset.cozyToken}` // Here we use the auth token
    },
    credentials: 'include' // don’t forget to include the session cookie
  })
  .then(function (response) {
    if (response.ok) {
      response.json().then((result) => {
        console.log(result);
      });
    } else {
      throw new Error('Network response was not ok.');
    }
  })
  .catch(function (error) {
    console.log('There has been a problem with your fetch operation: ' + error.message);
  });
});
```



## Read the manifest

Each application must have a “manifest”. It’s a JSON file named `manifest.webapp` stored at the root of the application directory. It describes the application, the type of documents it uses, the permissions it require…

Here’s a sample manifest:

```json
{
  "name": "My Awesome application",
  "permissions": {
    "apps": {
      "type": "io.cozy.apps"
    },
    "permissions": {
      "type": "io.cozy.permissions"
    },
    "settings": {
      "type": "io.cozy.settings"
    },
    "sample": {
      "type": "io.cozy.dev.sample",
      "verbs": ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    "jobs": {
      "type": "io.cozy.jobs"
    }
  },
  "routes": {
    "/": {
      "folder": "/",
      "index": "index.html",
      "public": false
    },
    "/public": {
      "folder": "/public",
      "index": "index.html",
      "public": true
    }
  }
}

```

### Permissions

Applications require permissions to use most of the APIs. Permissions can be described inside the manifest, so the server can ask the user to grant them during installation. Applications can also request permissions at run time.

A permission must at type contain a target, the type of objects the application want to interact with. Can be a document type, or an action on the server. By default, all grant on this object are granted, but we can also request fine grained permissions, for example limiting to read access. We can also limit the scope to a subset of the documents.

In the manifest, each permission is an object, with a random name and some properties:

 - `type`: **mandatory** the document type or action name
 - `description`: a text that will be displayed to the user to explain why the application require this permission
 - `verbs`: an array of HTTP verbs. For example, to limit permissions to read access, use `["GET"]`
 - `selector`: a document attribute to limit access to a subset of documents
 - `values`: array of allowed values for this attribute.

An application can request a token that grant access to a subset of its own permissions. For example if the application has full access to the files, it can obtain a token that give only read access on a file. Thus, the application can make some documents publicly available. The public page of the application will use this token as authentication token when accessing the API.

#### Samples

Application require full access to files:

```json
{
  "permissions": {
    "files": {
      "description": "…",
      "type": "io.cozy.files"
    },
  }
}
```

Application want to be able to read the contact informations of `cozy@cozycloud.cc`
```json
{
  "permissions": {
    "contact": {
      "type": "io.cozy.contacts",
      "verbs": ["GET"],
      "selector": "email",
      "values": ["cozy@cozycloud.cc"]
    }
  }
}

```


### Routing

The application must declare all of its URLs (routes) inside the manifest. A route is an object associating an URL to an HTML file. Each route has the following properties:

 - `folder`: the base folder of the route
 - `index`: the name of the file inside this folder
 - `public`: a boolean specifying whether the route is public or private (default).

Sample:

```json
"routes": {
  "/admin": {
    "folder": "/",
    "index": "admin.html",
    "public": false
  },
  "/public": {
    "folder": "/public",
    "index": "index.html",
    "public": true
  },
  "/assets": {
    "folder": "/assets",
    "public": true
  }
}
```


### `cozy-client-js`

This library embeds most of the available server APIs: manipulate documents and files, manage applications and server settings… It also provides some some methods to help application keep working while being offline.

The library expose a client API under the `window.cozy.client` namespace. Before using it, you have to initiate the library with the server parameters (the URL of the API and the auth token of your application):

```js
  window.cozy.client.init({cozyURL: "…", token: "…"});
```

The library supports two programming paradigms: callback and Promises, so you can use your favorite one. If you prefer using callbacks rather than Promises, just add `disablePromises` to the options when initializing the library:

```js
  window.cozy.client.init({cozyURL: "…", token: "…", disablePromises: true});
  window.client.settings.diskUsage(function (err, res) {
    (…)
  });
```

## Raw API documentation

In this tutorial, we’ll only see a few samples of how to use the library. For a complete description of all available methods, please refer to its own documentation:

 - [documents](https://github.com/cozy/cozy-client-js/blob/master/docs/data-api.md)
 - [files](https://github.com/cozy/cozy-client-js/blob/master/docs/files-api.md)
 - [authentification](https://github.com/cozy/cozy-client-js/blob/master/docs/auth-api.md)
 - [authentication with OAuth2](https://github.com/cozy/cozy-client-js/blob/master/docs/oauth.md)
 - [settings](https://github.com/cozy/cozy-client-js/blob/master/docs/settings-api.md)
 - [inter-app communication](https://github.com/cozy/cozy-client-js/blob/master/docs/intents-api.md)
 - [jobs and triggers](https://github.com/cozy/cozy-client-js/blob/master/docs/jobs-api.md)
 - [sharing](https://github.com/cozy/cozy-client-js/blob/master/docs/sharing-api.md)
 - [offline](https://github.com/cozy/cozy-client-js/blob/master/docs/offline.md)
 - [Cozy Bar](https://github.com/cozy/cozy-bar)

### Manipulating documents

Inside cozy data system, all documents are typed. To prevent applications to create document types with the same name but different description, the naming of the doctypes use [the Java specification](https://docs.oracle.com/javase/specs/jls/se8/html/jls-6.html#d5e8195). Every document type name must be prefixed by the reverted domain name of its creator. If you don’t own a domain name, you can also use your email address. For example, doctypes created by Cozy are prefixed by `io.cozy` or `io.cozy.labs`. If you don’t own a domain name, and your email address is `foo@bar.cloud`, prefix your doctype names with `cloud.bar.foo`.

We maintain an index of [all the currently available doctypes](https://cozy.github.io/cozy-doctypes/). To make your own doctypes available to other applications, please send a pull request to this repository.

Before manipulating documents, you have to request permission to access their doctype, either in the manifest or dynamically.

Every method allowing to handle document are available under the `cozy.client.data` namespace. For example:

 - `cozy.client.data.create(doctype, attributes)`, `cozy.client.data.update(doctype, doc, newdoc)` `cozy.client.data.delete(doctype, doc)` to create, update and delete documents
 - `cozy.client.data.updateAttributes(doctype, id, changes)` to only update some attributes of a document
 - `cozy.client.data.find(doctype, id)` return a document using its ident
 - `cozy.client.data.changesFeed(doctype, options)` get the latests updates of documents of a doctype
 - you can attach files to a document using `cozy.client.data.addReferencedFiles(doc, fileIds)` and list attachments with `cozy.client.data.listReferencedFiles(doc)`


### Querying

To search documents inside the database, you first need to create an index on some attributes of the documents, then perform a query on this index. The library offers the following methods:

 - `cozy.client.data.defineIndex(doctype, fields)` to create the index
 - `cozy.client.data.query(indexReference, query)` to query an index. The query parameter uses the syntax of the [Mango API](https://github.com/cloudant/mango) from CouchDB 2.

For example, to search contacts by their email address, you could use:

```javascript
cozy.client.data.defineIndex("io.cozy.contacts", ["email"])
.then((index) => {
  return cozy.data.query(index, {"selector": {email: "cozy@cozycloud.cc"}})
})
.then( (result) => {
  console.log(result[0].name);
});
```


### Manipulating files

The metadata of the files are stored inside the server database, allowing to perform advanced queries, and the files themselves on a virtual file system.

The library offer a lot of methods under `cozy.client.files` namespace to manipulate files. Most of the methods allows to manipulate a file or folder either by its id or by its full path. Here are the most commons ones, but a lot of other methods are available in the [raw API documentation](https://github.com/cozy/cozy-client-js/blob/master/docs/files-api.md):

 - `create()` and `updateById()` to create and update a file
 - `createDirectory()` to create a folder
 - `updateAttributesById()` et `updateAttributesByPath()` allow to update some metadata
 - use `destroyById` to remove a file
 - a virtual trash is available. You can put files into the trash (`trashById()`) and restore them (`restoreById()`). You can also list the content of the trash (`listTrash()`) and purge all trashed files (`clearTrash()`)
 - `statById(id)` et `statByPath(path)` return the metadata and, or folders, their content

#### Folders

When using `statById()` or `statByPath()` to get metadata of of folder, you can than call `relations()` on the resulting object to access their content. For example, to list content of the root folder, use:

```javascript
cozy.client.files.statByPath("/")
.then((dir) => {
  console.log(dir.relations("contents"));
})
```

Some special folder have a pre-defined id that will never change:

 - `io.cozy.files.root-dir` is the root of the filesystem
 - `io.cozy.files.trash-dir` is the trash.


## Discover the Cozy Bar

The [Cozy Bar](https://github.com/cozy/cozy-bar) is a component that display the Cozy menu on the top of your application and allow inter-apps features like content sharing.

Your application interacts with this component through `cozy-bar.js`, a library injected into your pages by the server when you add `{{.CozyBar}}` in the header. It exposes an API behind the window.cozy.bar namespace.

Before using it, you have to initialize the library: `window.cozy.bar.init({appName: "Mon application"})`.



## Style with Cozy UI

If you plan to build a webapp to run on Cozy, you’ll probably want to use a simple and elegant solution to build your interfaces without the mess of dealing with complex markup and CSS. Then [Cozy UI](https://github.com/cozy/cozy-ui/) is here for you!

It relies on Stylus as preprocessor. You can add it as a library in your project to use it out-of-the-box.

## Use Docker

*(remember what we previously said about the permissions required to run Docker: if your user doesn’t belong to the docker group, you’ll have to use `sudo` to run each of this commands.)*

To run your application inside the development server, just run the following command from the folder where your `index.html` and `manifest.webapp` files leave:

```sh
docker run --rm -it -p 8080:8080 -p 5984:5984 -p 8025:8025 -v $(pwd):/data/cozy-app --name cozydev cozy/cozy-app-dev
```

Let’s have a quick look at this command, so you can adapt it to your needs:

 - `--rm` will delete the server when you stop it. This prevent Docker from keeping a lot of unused stopped images
 - `-it` allow to attach an interactive terminal, so you’ll be able to use the command line inside the server
 - `-p 8080:8080`: the server listens on port 8080 on the virtual machine. We forward this port to the same port on your local machine. To use another local port, for example 9090, use `-p 9090:8080`
 - `-p 5984:5984`: this is just a convenient way to access the CouchDB database running inside the server. Point your browser to `http://cozy.tools:5984/_utils/` to access its administrative interface
 - `-p 8025:8025` : Cozy requires a mail server. In the development image, we don’t use a real email server, but a software that can display the sent messages. Just point your browser to `http://cozy.tools:8025/` to display the messages sent by the server
 - `-v $(pwd):/data/cozy-app` this mount the current folder, where your application leaves, inside the server. This is what make the application available on the server
 - `--name cozydev` name the running virtual machine `cozydev`, so you can easily refer to it from other Docker commands. For example, if you want to connect to a shell inside the server, you can use `docker exec -ti /bin/bash`

With this syntax, there is no data persistance: all your test data will be lost every time you stop the server. This is a good way to prevent side effects and start on a clean base, with an empty database.

However, if you want to persist data, you have to mount two folders from the virtual server to local folders: `/usr/local/couchdb/data` (database) and `/data/cozy-storage` (the virtual filesystem). This can be achieved by adding to the command line `-v ~/cozy/data/db:/usr/local/couchdb/data -v ~/cozy/data/storage:/data/cozy-storage` which will store the server’s data into `~/cozy/data`.


Once the server started, go to `http://app.cozy.tools:8080/#`, connect to the server with the default password `cozy` and you should be able to start testing your application.

You can also access the following URLs:

 - `http://cozy.tools:5984/_utils` to get the database administrative panel
 - `http://cozy.tools:8025/` to display the emails sent by the server.


### Test multiple applications

You can install more than one application into the development server, for example to test communication between applications. In order to achieve this, you have to mount the folder where your application leaves into subfolders of `/data/cozy-apps`. For example, if the code of Cozy Drive and Cozy Photos is on your local filesystem in `~/cozy/drive` and `~/cozy/photos`, start the development server with:

```sh
docker run --rm -it -p 8080:8080 -p 5984:5984 -p 8025:8025 -v "~/cozy/drive:/data/cozy-app/drive" -v "~/cozy/photos:/data-cozy-app/photos" --name=cozydev cozy/cozy-app-dev
```

You’ll access the applications by connecting to `http://drive.cozy.tools:8080/` and `http://photos.cozy.tools:8080`.

### What is `cozy.tools` ?

This development server use the domain names `*.cozy.tools`. We have parameterized this domain to always redirect to `127.0.0.1`, your local computer address. With that, no need to configure your environment to set extra local hosts for development anymore.
