const { merge, once } = require('lodash')
const log = require('./log')
const Handlebars = require('handlebars')
const path = require('path')

/**
 * Creates a helper that will stay same after being processed by Handlebars
 *
 * There are two Handlebars passes on the data :
 *
 * 1. At load time to create dummy data
 * 2. When the data is being inserted so that we can reference data being created
 *
 * Since we need the `reference` helper to stay the same for the second pass, we
 * create it with `passthroughHelper`.
 *
 * @param  {string}   name     - The name of the created helper
 * @param  {function} callback - Callback to run when the helper is executed
 * @return {string}            - A helper that when called will creates itself
 *
 * @example
 * const reference = passthroughHelper('reference')
 * Handlebars.registerHelper({ reference })
 * const str = Handlebars.compile("{{ reference 'io.cozy.files' 0 '_id' }}")()
 * > str = "{{ reference 'io.cozy.files' 0 '_id' }}"
 */
const passthroughHelper = function(name, callback) {
  return function() {
    callback && callback()
    return new Handlebars.SafeString(
      `{{ ${name} ${Array.from(arguments)
        .slice(0, -1)
        .map(singleQuoteString)
        .join(' ')} }}`
    )
  }
}

const singleQuoteString = function(value) {
  if (typeof value === 'string') {
    return `'${value}'`
  } else {
    return value
  }
}

module.exports = (handlebarsOptionsFile, options) => {
  // dummy-json pass helpers
  const turnOffParallelism = once(function() {
    log.debug('Turning off parallelism since {{ reference }} helper is used.')
    options.parallel = false
  })

  let handlebarsOptions = {
    helpers: {
      dir: passthroughHelper('dir'),
      reference: passthroughHelper('reference', turnOffParallelism)
    }
  }

  if (handlebarsOptionsFile) {
    handlebarsOptions = merge(
      handlebarsOptions,
      require(path.resolve(`./${handlebarsOptionsFile}`))
    )
  }

  return handlebarsOptions
}
