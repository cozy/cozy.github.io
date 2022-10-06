const path = require('path')
const fs = require('fs-extra')
const getManifestAsObject = require('./utils/getManifestAsObject')
const tags = require('./tags')
const publisher = require('./publisher')
const logger = require('./utils/logger')

const getManifestManual = ctx => {
  return getManifestAsObject(
    path.join(fs.realpathSync(process.cwd()), ctx.buildDir)
  )
}

const getAppVersionManual = async ctx => {
  let tagVersion, devVersion
  if (!ctx.manualVersion) {
    const versionTags = (await tags.getVersionTags()).filter(tag =>
      ctx.tagPrefix ? ctx.tagPrefix === tag.prefix : true
    )
    tagVersion = versionTags.length > 0 ? versionTags[0].fullVersion : undefined
    if (tagVersion) {
      tags.assertOKWithVersion(tagVersion, ctx.appManifestObj.version)
    } else {
      devVersion = await tags.getDevVersion(ctx.appManifestObj.version)
    }
  }

  logger.info(
    `Getting app version ${
      ctx.tagPrefix ? ` with prefix ${ctx.tagPrefix}` : ''
    }`
  )
  return (
    tagVersion || devVersion || ctx.manualVersion || ctx.appManifestObj.version
  )
}

const manualPublish = publisher({
  getManifest: getManifestManual,
  getAppVersion: getAppVersionManual,
  showConfirmation: true
})

const manualPublishCLI = function () {
  return manualPublish.apply(this, arguments).catch(e => {
    console.error(e)
    console.error(e.message)
    process.exit(1)
  })
}

manualPublishCLI.manualPublish = manualPublish

module.exports = manualPublishCLI
