const fs = require('fs-extra')
const path = require('path')
const colorize = require('./colorize')

function getManifestAsObject(buildDirPath) {
  let manifestName = null
  if (fs.existsSync(path.join(buildDirPath, 'manifest.webapp'))) {
    manifestName = 'manifest.webapp'
  } else if (fs.existsSync(path.join(buildDirPath, 'manifest.konnector'))) {
    manifestName = 'manifest.konnector'
  }
  if (!manifestName) {
    throw new Error(
      colorize.red('Application manifest file is missing. Publishing failed.')
    )
  }
  const appManifestObj = fs.readJSONSync(path.join(buildDirPath, manifestName))
  return appManifestObj
}

module.exports = getManifestAsObject
