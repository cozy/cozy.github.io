# Common issues

We tried to make debug logs clear for every common issues we stumble upon, Most of the time, reading the app logs might help you debug the problem. In this documentation you can find different ways of resolving the issue. If you cannot find help in this doc, do not hesitate to contact us on [Libera chat](https://web.libera.chat/#cozycloud)

##### My worker function does not execute

- Check if you do not have forgotten to add it in the `additionalExposedMethodsNames` array. All handmade `worker`'s function needs to be declared for the `pilot` to be able to call them.
- Check if you are calling it correctly, from the `pilot`, using `this.runInWorker('yourFunction')` or `this.runInWorkerUntilTrue({method: 'yourFunction'})`

##### My `saveFiles` function crashes instantly when the execution reaches it

- Check if you are passing arguments correctly, in an object. At least the three mentioned in the [CliSK template PR](https://github.com/konnectors/template_ccc/blob/doc/DevelopmentExample/src/index.js#L158) like `context`, `fileIdAttributes` and `contentType`.
- Check if you are giving an array containing the files.
- Check the files you are trying to save, maybe they are missing a mandatory attributes.
