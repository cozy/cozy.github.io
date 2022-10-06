const runHooks = require('./runhooks')

module.exports = async options =>
  runHooks(options.postpublishHook, 'post', options)
