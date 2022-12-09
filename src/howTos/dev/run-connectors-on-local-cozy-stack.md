---
title: How to run connectors with a local cozy-stack
---

Running connectors to test them with a local cozy-stack gives a quick feedback loop but requires a little setup.

### Prerequisite

- Have a local cozy-stack installed
- Have NodeJS installed at the system level

### Copy the default config file if not already done

Create a directory  `~/.cozy` and copy the default configuration file into it. Be careful, the file name and location matter, as explained in the [config documentation](https://docs.cozy.io/en/cozy-stack/config/).

```bash
cp cozy-stack/cozy.example.yaml ~/.cozy/cozy.yaml`
```

### Edit the config file

Edit the file `~/.cozy/cozy.yaml` and change the line after the `konnectors:` entry to have this:

```yaml
cmd: /home/alice/.cozy/scripts/konnector-node-run.sh
```

### Create the script to execute the service

Copy the file `cozy-stack/scripts/konnector-node-run.sh` to `~/.cozy/konnector-node-run.sh`:

Then you need to `chmod +x ~/.cozy/scripts/konnector-node-run.sh`

Be sure to have `node` in your `/usr/bin` or `/usr/local/bin` folder. If not, you can add a symlink to `node` in one of those folder, for example by typing `ln -s $(which node) /usr/local/bin/node`

### Get your service logs in a isolated file

Edit your `~/.cozy/konnector-node-run.sh` by adding a tee output.

```bash
node "${arg}" | tee -a ~/.cozy/services.log
```

Now you can `tail -f ~/.cozy/services.log` to watch logs in real time.

## Install your konnector

To install the konnector containing the service on your local stack, you must give the path of your build:

```bash
cozy-stack konnector install <konnector_name> file://<build_path>
# Example:
# cozy-stack apps install ameli file:///home/alice/ameli/build
```

Each time you make modifications to your builded konnector, you must update the app on the stack to propagate the changes:

```bash
cozy-stack konnectors update <konnector_name>
```


## Konnector is a service anyway

As a konnector is subtype of service in cozy, you can look at a more global documentation here: [Develop a service](https://docs.cozy.io/en/howTos/dev/services/)
