# Developping an OAuth connector

Connectors with OAuth are a special case. The OAuth protocol needs a secret key most of the time
and getting the token to access the api takes different forms depending on the targeted api. And
you do not want your secret api key to be available in the connector source code.

That is why the stack will handle the OAuth protocol for you.

You can have more details on how this is done and deployed in the [cozy-stack
documentation](https://docs.cozy.io/en/cozy-stack/konnectors-workflow/#oauth-and-service-secrets)

## Connector development

It is possible to develop an OAuth connector in [standalone or dev mode](https://docs.cozy.io/en/cozy-konnector-libs/cli/) but there will be no stack
to handle the protocol. You will have to do it manually (with curl for example). Most apis have
extended documentations for this.

Once you have got your access token, simply add it your konnector-dev-config.json file like this :

```json
{
  "fields": {
    "access_token": "<ACCESS_TOKEN>",
  }
}
```

This access_token will be accessible in your connector exactly like it would when the connector is
run by the cozy stack.

```javascript
module.exports = new BaseKonnector(start)

async function start(fields) {
  // you can use fields.access_token to request your api
}
```

If your access_token becomes outdated, you will have to refresh it yourself and replace it in
konnector-dev-config.json

Here is a list of existing OAuth connectors : [google](https://github.com/konnectors/cozy-konnector-google), [facebook](https://github.com/konnectors/cozy-konnector-facebook/)

## Packaging for a real cozy

When your connector is ready and works in standalone mode, it is time to package it to run in a
real cozy. Here is what is needed.

 1) OAuth configuration in the "secrets/io-cozy-account_types" database
 2) scope configuration in the connector manifest if needed

1) OAuth is implemented in some different ways depending on the targetted service and the stack
needs to know some details about the api :

- grant_mode : "authorization_code" or "refresh_token"
- client_id : the client id given by the api provider
- client_secret : the client secret given by the provider
- auth_endpoint: the url which will be used to authenticate
- token_endpoint: the url which will be used to fetch a token
- token_mode: (optionnal: "basic", "get") specify the way the client id and secret will be given to the api. If not specified, a the HTTP post method will be used
- redirect_uri: standard OAuth redirect uri it take the following form : "<https://oauthcallback.><domain>/accounts/<slug>/redirect

These parameters will be saved in the "secrets/io-cozy-account_types" database in the following
form for facebook :

```json
{
  "_id": "facebook",
  "grant_mode": "authorization_code",
  "redirect_uri": "https://oauthcallback.cozy.tools:8080/accounts/facebook/redirect",
  "token_mode": "get",
  "token_endpoint": "https://graph.facebook.com/v2.12/oauth/access_token",
  "auth_endpoint": "https://www.facebook.com/v2.12/dialog/oauth",
  "client_id": "...",
  "client_secret": "..."
}
```

To provision this configuration in your own local cozy, you can use curl for example :

```sh
curl -X PUT localhost:5984/secrets%2Fio-cozy-account_types/facebook -d '{ "grant_mode": "authorization_code", "client_id": "...", "client_secret": "...", "auth_endpoint": "https://www.facebook.com/v2.12/dialog/oauth", "token_endpoint": "https://graph.facebook.com/v2.12/oauth/access_token", "token_mode": "get", "redirect_url": "https://oauthcallback.cozy.tools:8080/accounts/facebook/redirect" }'
```

And if you want this to be provisioned in production cozies in mycozy.cloud domain, please contact
us.

2) Most Oauth apis need [scope](https://oauth.net/2/scope/) configuration. To be more versatile, this scope configuration in done
in the connector manifest in the "oauth.scope" attribute :

```json
  "oauth": {
    "scope": [
      "scope1 scope2"
    ]
  }
```

Once the manifest and the account_types databases are setup, you can build and deploy your
connector normally and the home application will handle the display of OAuth page automatically
on account creation.
