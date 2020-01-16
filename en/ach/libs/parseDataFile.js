const dummyjson = require('dummy-json')
const fs = require('fs')

module.exports = (filepath, handlebarsOptions) => {
  const template = fs.readFileSync(filepath, { encoding: 'utf8' })

  // dummy-json pass passthrough helpers
  const data = JSON.parse(dummyjson.parse(template, handlebarsOptions))

  return data
}
