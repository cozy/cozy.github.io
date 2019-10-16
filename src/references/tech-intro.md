---
title: Technical introduction to the Cozy platform
---

## What is Cozy?

Cozy is a personal server hosting applications that allow collect and manipulate all your personal data.

Depending on your point of view, Cozy can be seen as :

1. A place to keep your personal data
2. A core API to handle the data
3. Your web apps, and also the mobile & desktop clients
4. A coherent User Experience.

The whole platform is designed around 3 key values : *Simple*, *Versatile*, *Yours*.

These values have a lot of meaning for Cozy in all aspects. From an architectural point of view, they are declined like this:

 - *simple* and easy to understand and deploy. Cozy doesn’t require to setup and manage a lot of micro-services;
 - *versatile*: your server is comfortable anywhere. You can host a single instance on a small Raspberry π at home, or a cluster of thousands instances on dedicated servers inside a datacenter;
 - *yours*: the users are the owners of their data, they keep the control. They can migrate their data from one server to another, and are not dependant from a single hosting provider. As we say: “you will stay because you can leave”;


## Architecture overview

Several layers can be distinguished. From inside to outside:

 - the core is a database that store all user data;
 - the database is accessible through a layer that control accesses and expose a REST API;
 - Web applications and other clients offer nice user interfaces to interact with the data.

<img src="../../img/dev/cozy_archi.png" width="600">


## The server (Cozy-stack - [documentation](https://docs.cozy.io/en/cozy-stack/))

The server consist of a single process. We call it *the Cozy stack*. 

The server is in charge of serving the Web applications users have installed from the application store.

It provides its services through a REST API that allows to:

 - create, update, delete documents inside the database;
 - authenticate users and client applications;
 - send emails;
 - launch jobs on the server. Connectors that import data from remote websites are some sort of jobs. Jobs can be one time tasks (sending a message) or periodic tasks. Some jobs, like the connectors, that require executing third party code on the server side, are sandboxed (we use `nsjail` for now).
 - …

The server also allow to access the database replication API, allowing to sync documents between the server and local databases, for example in mobile clients.

Two authentication methods are available:

 - Web applications running on the server get a session token when the user log in;
 - OAuth2 for other applications.


## The database

CouchDB is a document database. Everything, from user data to server settings, is stored inside typed documents, identified by an unique id.

Two request methods are allowed: map-reduce or `Mango`, a specific query language.

Every document has a `doctype`, and we keep an index of the definition of every doctype.

Binary data are stored outside the database. Depending on the server configuration, they may be stored on a file system or a dedicated object storage like `swift`.

The *datasystem* layer inside the Cozy stack is in charge of controlling access rights on documents and binaries. It allows fine gained access control, on a whole doctype or on a set of documents.


## The applications

There are two kind of applications:

 - **web applications**: Single Page Applications (SPA) written in HTML and JavaScript that run inside the user's browser. They interact with the server through its API. This API allows to manipulate data and files and to perform miscellaneous tasks, like send emails
 - **connectors**: Small application written in JavaScript, running on the server, that import your data from remote sources.

The server provides services to applications:

 - real time notifications of events;
 - methods allowing applications to communicate and share data;
 - interapps : applications can expose "capabilities" that other apps can call. For instance an app can expose the capability to pick a photo or to create a contact.
 - methods allowing sharing of documents between servers. This is a peer-to-peer protocol so that even users hosted on different infrastructure can share their data which are synchronized (the cozy stack propagates modifications between users servers).


## Application store

An application registry lists every available applications, and their characteristics. Each application can:

 - create its own doctypes;
 - request permission to access documents;
 - offer services to other applications;
 - register publics routes;
 - create jobs that will be run on server side.


## Application isolation

Each application uses its own sub-domain, so it gets sandboxed inside the browser: other application are not able to steal its access token or access its data.

We use *Content Security Policy* to control what the application is allowed to do. For example, Web applications running inside Cozy are not allowed to send requests to other websites. This allows a strict control over applications, preventing them to leak your data.


## Further reading

 * Coding tutorials :
     * [Create a client application](../tutorials/app.md)
     * [Develop a connector](../tutorials/konnector/index.md).
 * Selfhosting : [How to to self-host a Cozy server](../tutorials/selfhost-debian.md)
 * The [cozy server documentation](https://docs.cozy.io/en/cozy-stack/) (cozy-stack)
