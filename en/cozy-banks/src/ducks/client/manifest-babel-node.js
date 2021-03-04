/**
 * This files overrides the manifest.js from the same folder when in the
 * context of the service CLI, see babel.config.js ("cli" env part), otherwise
 * the manifest.webapp cannot be imported as a JSON.
 */

const fs = require('fs')
const path = require('path')

export default JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../manifest.webapp')).toString()
)
