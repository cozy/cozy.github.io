const { getOptions } = require('loader-utils')
const validateOptions = require('schema-utils')
const merge = require('lodash/merge')

const schema = {
  type: 'object',
  properties: {
    additionalProperties: {
      type: 'object'
    }
  }
}

module.exports = function (source) {
  const options = getOptions(this)

  validateOptions(schema, options, 'Manifest loader')

  const manifest = JSON.parse(source)
  const newManifest = merge(manifest, options.additionalProperties)

  return `module.exports = ${JSON.stringify(newManifest)}`
}
