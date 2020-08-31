---
title: Develop a service from your application
summary: Execute server-side and asynchronous code from your application.
---


## What is it for?

Applications may require server-side code execution that could not, or should not, be in the client. This might be useful for heavy computations or for tasks triggered after some events, typically after data is retrieved through [konnectors](https://docs.cozy.io/en/cozy-stack/konnectors/) or mobile/desktop sync, without the user being on the application.

In contrast to konnectors, services have the same permissions as the web application and are not intended to collect information from the outside. It is rather meant to asynchronously analyse data inside the cozy and emit some output once the task is done. However, they share the same mechanisms as the konnectors to describe how and when they should be executed: via our [trigger system](https://github.com/cozy/cozy-stack/blob/master/docs/jobs.md).


## Example

You can find an example of an existing service in the [cozy-banks app](https://github.com/cozy/cozy-banks/blob/master/src/targets/services/onOperationOrBillCreate.js).

## CozyClient instanciation 

By using `fromEnv`, you will be able to use the service in dev mode (via cozy-konnector-dev see [Execution](#execution)) or in production. 
```js
const client = CozyClient.fromEnv(process.env, { schema })
```


## Service declaration

The service must be declared in the app [manifest](https://docs.cozy.io/en/tutorials/app/#read-the-application-manifest). For example:

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
* `file`: the single (packaged) file containing the code to execute as a service. It must be the **relative** path to the built service's file, not the source one. Expl: `/services/name-of-service/built-file.js`. Look at your `build` folder or build/watch console output to find it.
* `trigger`: what triggers the service. It must follow the available triggers described in the [jobs documentation]( https://github.com/cozy/cozy-stack/blob/master/docs/jobs.md). In this example, the trigger is a bank operation creation.
* `debounce` (optionnal): force a minimal delay between two runs of the service. `m` is for minutes and `s` for seconds. if this parameter is omitted, the service will be executed as soon as it can.

## Build

The service must be packaged into a single file containing all the dependencies. An example of a webpack rule is available [here](https://github.com/cozy/create-cozy-app/blob/master/packages/cozy-scripts/config/webpack.config.services.js). Note that `target: 'node'` is important as the service is run as a Node.js process.

In this example, the services are built alongside your app using `yarn watch`.


## Stack

As the service is run on a dedicated process on the server side, a running stack is necessary. You can either use a stack installed [with docker](https://docs.cozy.io/en/howTos/dev/runCozyDocker/#run-with-a-custom-stack-config-file) or directly [from source](https://github.com/cozy/cozy-stack/blob/master/docs/INSTALL.md).

Some configuration is required to execute the service and store the produced logs, to facilitate the development. The following instructions are for a stack installed from source, but you can adapt it for a docker installation: you have to download the [default config file](https://github.com/cozy/cozy-stack/blob/master/cozy.example.yaml), modify it as described below and indicate its location through the docker command, as explained [here](https://docs.cozy.io/en/howTos/dev/runCozyDocker/#run-with-a-custom-stack-config-file).

In the following, we assume that your `$HOME` is /home/alice, so change accordingly to your own `$HOME`.

### Copy the default config file

Create a directory  `~/.cozy` and copy the default configuration file into it. Be careful, the file name and location matter, as explained in the [config documentation](https://github.com/cozy/cozy-stack/blob/master/docs/config.md).


```bash
cp cozy-stack/cozy.example.yaml ~/.cozy/cozy.yaml`
```

### Edit the config file


Edit the file `~/.cozy/cozy.yaml` and change the line after the `konnectors:` entry to have this:

```yaml
cmd: /home/alice/.cozy/scripts/konnector-node-run.sh
```

[Optional] Then, after the entry `fs:`
```yaml
url: file:///home/alice/.cozy/storage
```

### Create the script to store the logs


Create the file `~/.cozy/scripts/konnector-node-run.sh`:
```bash
#!/bin/bash

rundir="${1}"
cd $rundir
node index.js | tee ~/.cozy/services.log
```
Then you need to `chmod +x ~/.cozy/scripts/konnector-node-run.sh`

Be sure to have `node` in your `/usr/bin` or `/usr/local/bin` folder. If not, you can add a symlink to `node` in one of those folder, for example by typing `ln -s $(which node) /usr/local/bin/node`

Now you can `tail -f ~/.cozy/services.log` to watch logs in real time.

## Install your app

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
However, you can force its execution thanks to the `cozy-konnector-dev` CLI, which can be useful for developement. Be aware, that in that case, you can't rely on any of the [stack provided variables](https://docs.cozy.io/en/cozy-stack/apps/#available-fields-to-the-service)

To install locally:
```bash
yarn add --dev cozy-jobs-cli
```

To run:
```bash
yarn run cozy-konnector-dev -m <app_manifest> <mybuiltservice.js>
```

Be carefull the `mybuiltservice.js` **must be** the built file of your service, not the source.

If your `mybuiltservice.js` is not executable and not recognize by node, you may need this script in your app folder to fix that. Just change the `target` path.
```bash
#!/bin/bash

target="build/services/sync-index-displayName/contacts.js"
firstChar=$(head -c 1 $target)

chmod +x $target
if [[ $firstChar != \#* ]]; then
  sed -i '' '1i\
  #!/usr/bin/env node
  ' $target
fi
cozy-konnector-dev -m manifest.webapp $target
```
