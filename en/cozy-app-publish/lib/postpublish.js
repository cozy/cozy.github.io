const runHooks = require('../utils/runhooks')

module.exports = async options =>
  runHooks(options.postpublishHook, 'post', options)
