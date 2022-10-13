## Let’s create our first connector
### Run the sample

>  ❗ _Replace links when all had been sat up_

The easiest way to create a new connector is to use [clisk-template](https://github.com/konnectors/clisk-template) .


First of all, [download](https://github.com/konnectors/clisk-template) or clone the repository:

```sh
git clone https://github.com/konnectors/clisk-template [newslug]
cd [newslug]
rm -rf .git
git init
yarn install # or npm install
```

_note: we use `yarn`, but if you prefer `npm`, keep using it, everything should work._

The connector is ready to run with sample code.
As a demo we will scrape a fictional website: [books.toscrape.com](http://books.toscrape.com), for which **you do not need credentials**.

> ## (WIP) How contributors are supposed to run their connectors

Please check [CLI section of the documentation](https://docs.cozy.io/en/cozy-konnector-libs/cli/) for more information.

If you have arrived here, good job ! You are ready to [implement your connector](./scrape-data.md).
