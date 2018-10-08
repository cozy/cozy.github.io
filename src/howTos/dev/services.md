---
title: Develop a service from your application
summary: Execute server-side and asynchronous code from your application.
---


## What is it for?

Applications may require server-side code execution that could not and should not be in the client. This might be useful for heavy computations or for tasks triggered after some events, typically after data is retrieved through [konnectors](https://cozy.github.io/cozy-stack/konnectors.html) or mobile/desktop sync, without the user being on the application.

In contrast to konnectors, services have the same permissions as the web application and are not intended to collect information from the outside. It is rather meant to asynchronously analyse data inside the cozy and emit some output once the task is done. However, they share the same mechanisms as the konnectors to describe how and when they should be executed: via our [trigger system](https://github.com/cozy/cozy-stack/blob/master/docs/jobs.md).


 background and offline process to analyse the user's data and emit some output even without the user being on the application. These part of the application are called services and can be declared as part of the application in its manifest.



## Example

You can find an example of an existing service in the [cozy-banks app](https://github.com/cozy/cozy-banks/blob/master/src/targets/services/onOperationCreate.js).

## Service declaration

The service must be declared in the app [manifest](https://docs.cozy.io/en/dev/app/#read-the-manifest). For example:

```json
"services": {
  "onOperationCreate": {
    "type": "node",
    "file": "onOperationCreate.js",
    "trigger": "@event io.cozy.bank.operations:CREATED",
    "debounce": "3m"
  }
}
```

Here is an explanation of the fields:

* `type`: describe the code type (only `node` for now).
* `file`: the single (packaged) file containing the code to execute as a service.
* `trigger`: what triggers the service. It must follow the available triggers described in the [jobs documentation]( https://github.com/cozy/cozy-stack/blob/master/docs/jobs.md). In this example, the trigger is a bank operation creation.
* `debounce` (optionnal): force a minimal delay between two runs of the service. `m` is for minutes and `s` for seconds. if this parameter is omitted, the service will be executed as soon as it can.

## Build

The service must be packaged into a single file containing all the dependencies. An example of a webpack rule is available [here](https://github.com/cozy/cozy-banks/blob/master/config/webpack.target.services.js). Note that `target: 'node'` is important as the service is run as a Node.js process.

A `watch:services` entry can also be added in the package.json, like in this [example](https://github.com/cozy/cozy-banks/blob/master/package.json). Then the service is simply built with this command:

```bash
yarn watch:services
```

### Stack

As the service is run on a dedicated process on the server side, a running stack is necessary. For development, it is easier to use a stack installed without docker, as some configuration is necessary, notably to retrieve the logs of the service. For the stack's installation instructions, follow the [guide](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md).

Once you have a stack installed and running, create a directory  `~/.cozy` and copy the default configuration file into it. Be careful, the file name and location matter, as explained in the [config documentation](https://github.com/cozy/cozy-stack/blob/master/docs/config.md).

In the following, we assume that your `$HOME` is /home/alice, so change accordingly to your own `$HOME`.

```bash
cp cozy-stack/cozy.example.yaml ~/.cozy/cozy.yaml`
```

Edit the file `~/.cozy/cozy.yaml` and change the line after the `konnectors:` entry to have this:

```yaml
cmd: /home/alice/.cozy/scripts/konnector-node-run.sh
```

Then, after the entry `fs`:
```yaml
url: file:///home/alice/.cozy/storage
```


Create the file `~/.cozy/scripts/konnector-node-run.sh`:
```bash
#!/bin/bash

rundir="${1}"
cd $rundir
node index.js | tee ~/.cozy/services.log
```

To install the app containing the service on your local stack, you must give the path of your build:

```bash
cozy-stack apps install <app_name> file://<build_path>
```

Each time you make modifications to your service, you must update the app on the stack to propagate the changes:
```bash
cozy-stack apps update <app_name>
```


## Execution

The service will be run each time the trigger condition is met, e.g. a bank operation.
However, you can force its execution thanks to the `cozy-run-dev` CLI.

To install:
```bash
yarn global add cozy-jobs-cli
```

To run:
```bash
cozy-run-dev -m <app_manifest> <mybuiltservice.js>
```
