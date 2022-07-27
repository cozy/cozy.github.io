---
title: How to run connectors with a local cozy-stack
---

Running connectors to test them with a local cozy-stack gives a quick feedback loop but requires a little setup.

## Prerequisite

- Have a local cozy-stack installed
- Have NodeJS installed at the system level

## Configure your local cozy-stack

Your local cozy-stack needs to know where to find the connectors runner on your filesystem. To this end, you'll need to [download the script](https://raw.githubusercontent.com/cozy/cozy-stack/master/scripts/konnector-node-run.sh) from the [cozy-stack repository](https://github.com/cozy/cozy-stack) (or clone the entire repository) and then set the path in your `cozy.yaml` file as such:

```yaml
# This top-level key might already exist if you used the template from the 
# cozy-stack repository
konnectors:
  cmd: <absolute path to konnector-node-run.sh>
 
```

You can now restart your local cozy-stack and install your connector (for more information on how to run a connector from a local directory, check the [connectors tutorial](https://docs.cozy.io/en/tutorials/konnector/save-data/)).
