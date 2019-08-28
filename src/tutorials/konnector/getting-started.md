## Let’s create our first connector

The easiest way to create a new connector is to use [cozy-konnector-template](https://github.com/konnectors/cozy-konnector-template):

ℹ There is also a [(french) youtube video to create your first connector](https://www.youtube.com/watch?v=gp0cE8kHEBc&list=PLBgB0F1WGyOXMqKZe-Q1ql0Fz-ohPkq6-)

### Run the sample

First of all, [download](https://github.com/konnectors/cozy-konnector-template/archive/master.zip) or clone the repository:

```sh
git clone https://github.com/konnectors/cozy-konnector-template cozy-konnector-newservice
cd cozy-konnector-newservice
rm -rf .git
git init
yarn install # or npm install
```
_note: we use `yarn`, but if you prefer `npm`, keep using it, everything should work._

The connector is ready to run with sample code.
As a demo we will scrape a fictional website: [books.toscrape.com](http://books.toscrape.com), for which __you do not need credentials__.

As indicated in the `README.md` file, just run:

```sh
yarn standalone # or npm run standalone
```
The very first run will create a `konnector-dev-config.json` file that allows you to configure the connector input when executing it with the CLI.
This configuration comes from [Cozy Home][] when deployed.

```json
{
  "COZY_URL": "http://cozy.tools:8080",
  "fields": {
    // configuration injected to the start function
  }
}
```

The `fields` property allows you to set credentials for the targeted web service, such as `login` and `password` as if they come from [Cozy Stack][] (so from a real Cozy Cloud instance). You can add as many fields as the targeted service needs. 

The `COZY_URL` property will be used later. You do not need to change it for now.

As explained earlier, the demo website [books.toscrape.com](http://books.toscrape.com) does not need any credentials.
But for the code to run without error, you need to register a _fake_ login and a _fake_ password:

```json
{
  "COZY_URL": "http://cozy.tools:8080",
  "fields": {
    "login": "zuck.m@rk.fb",
    "password": "123456"
  }
}
```

**In the template, this configuration file is already added to `.gitignore` file to be sure your credentials stay private.**

Now you can run the connector again in *standalone* mode to see how jpg and related data are downloaded.
In this mode, [cozy-client-js][] is stubbed and all data meant to be saved in a cozy are displayed in the standard output and files are saved in the ./data directory of the connector.
This is useful to start developing your connector without handling the state of a real cozy stack.

Please check [CLI section of the documentation](https://github.com/cozy/cozy-konnector-libs/blob/master/packages/cozy-konnector-libs/docs/cli.md) for more information.

If you have arrived here, good job ! You are ready to [implement your connector](./implement.md).

[Cozy Home]: https://github.com/cozy/cozy-home
[Cozy Stack]: https://github.com/cozy/cozy-stack
[cozy-client-js]: https://github.com/cozy/cozy-client-js

