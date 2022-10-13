## Let’s create our first konnector
### Run the sample

>  ❗ _Replace links when all had been set up_

The easiest way to create a new konnector is to use the [clisk-template](https://github.com/konnectors/cozy-konnector-template)


First of all, [download](https://github.com/konnectors/cozy-konnector-template) or clone the repository:

```sh
git clone https://github.com/konnectors/cozy-konnector-template/[newslug]
cd [newslug]
rm -rf .git
git init
yarn install # or npm install
```

_note: we use `yarn`, but if you prefer `npm`, keep using it, everything should work._

The konnector is ready to run with sample code.
As a demo we will scrape a fictional website: [books.toscrape.com](http://books.toscrape.com), for which **you do not need credentials**.

If you have arrived here, good job ! You are ready to [implement your konnector](./scrape-data.md).
