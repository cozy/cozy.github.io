# Best Coding Practice

### Coding standards

A yarn script is provided to lint the code. It will respect most of our coding standards. Simply use the `yarn lint --fix` command

#### Logs

Regarding the logs you might put in your code, it is recommended to avoid logging sensible information once the konnector is ready to go to production.
It might me obvious but better safe than sorry.

On the other hand, keep it simple and practical. For debug purpose, it's good to have a starting log at the beginning of each _main_ functions, just to track possible bugs more efficiently. You can use the common type of log such as :

- `info` , to keep track of the execution steps, state of a page or anything worth seeing during the execution like number of found files for example
- `debug`, only visible when the instance is in debug mode once in production. Could be used to have a better overview of what is happening during the execution without polluting the log flow.
- `error` , to -of course- clearly show an error as occurred. However it is rarely used in production as we will prefer to throw an error with the JS native `throw new Error()` . It will stop the execution of the konnector if a critical error show up like a website maintenance.

```javascript
// info
this.log("info", "This is an info log");

// debug
this.log("debug", "This is a debug log");

// error
this.log("error", "This is an error log");
throw new Error("Error that stops the execution");
```

### Testing

#### Testing your CliSK

There is no unit tests for CliSK as execution's result is strongly dependent of the target website for the specific account you are using to develop. For example maybe you can find on the account used to develop the user's mail and no phone number associated, while another account on the same website may have both of them but no files to download etc .... Doing unit tests for each and every scenarios of each and every type of accounts would be like catching the wind so we are trying to be the most generic possible to fit the most of the accounts.

You should have tested the konnector during your development phase, as you have to build step by step execution and cover the know scenarios for your account. Meaning that if you think it is ready, you probably have run the konnectors multiple times, ending in `Konnector success` .
