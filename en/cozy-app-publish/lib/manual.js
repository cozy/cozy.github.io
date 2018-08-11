const path = require('path')
const fs = require('fs-extra')
const postpublish = require('./postpublish')
const prepublish = require('./prepublish')
const publish = require('./publish')
const prompt = require('prompt')
const colorize = require('../utils/colorize')
const getManifestAsObject = require('../utils/getManifestAsObject')
const constants = require('./constants')

const { DEFAULT_REGISTRY_URL, DEFAULT_BUILD_DIR } = constants

// override is used only for test to skip prompt (cf prompt.override)
async function manualPublish(
  {
    buildCommit,
    postpublishHook,
    prepublishHook,
    registryToken,
    buildDir = DEFAULT_BUILD_DIR,
    manualVersion,
    registryUrl = DEFAULT_REGISTRY_URL,
    spaceName,
    appBuildUrl
  },
  override
) {
  // registry editor token (required)
  if (!registryToken) {
    throw new Error('Registry token is missing. Publishing failed.')
  }

  // application manifest (required)
  const appManifestObj = getManifestAsObject(
    path.join(fs.realpathSync(process.cwd()), buildDir)
  )

  // registry editor (required)
  const registryEditor = appManifestObj.editor
  if (!registryEditor) {
    throw new Error(
      'Registry editor is missing in the manifest. Publishing failed.'
    )
  }

  // get application version to publish
  if (!manualVersion) {
    throw new Error(
      'The --manual-version option is required for the manual mode. Publishing failed.'
    )
  }
  const appVersion = manualVersion || appManifestObj.version

  // other variables
  const appSlug = appManifestObj.slug
  const appType = appManifestObj.type || 'webapp'

  // get archive url
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  if (!appBuildUrl) {
    throw new Error(
      'The --build-url option is required for the manual mode. Publishing failed.'
    )
  }

  const promptProperties = [
    {
      name: 'confirm',
      description: colorize.orange(
        'Are you sure you want to publish this application above?'
      ),
      pattern: /^y(es)?$|^n(o)?$/i,
      message: 'Yes (y) or No (n)',
      required: true
    }
  ]

  // useful for testing
  if (override) prompt.override = override

  const publishOptions = await prepublish({
    buildCommit,
    prepublishHook,
    registryUrl,
    registryEditor,
    registryToken,
    spaceName,
    appSlug,
    appVersion,
    appBuildUrl,
    appType
  })

  // ready publish the application on the registry
  console.log(
    `Attempting to publish ${colorize.bold(
      publishOptions.appSlug
    )} (version ${colorize.bold(
      publishOptions.appVersion
    )}) from ${colorize.bold(
      publishOptions.appBuildUrl
    )} (sha256 ${colorize.bold(publishOptions.sha256Sum)}) to ${colorize.bold(
      publishOptions.registryUrl
    )} (space: ${publishOptions.spaceName || 'default one'})`
  )
  console.log()

  prompt.start()
  prompt.message = colorize.bold('Confirmation:')
  prompt.delimiter = ' '
  return prompt.get(promptProperties, async function(err, received) {
    console.log()
    if (err) throw new Error(colorize.red(`prompt: ${err}`))
    if (received.confirm.match(/^y(es)?$/i)) {
      await publish(publishOptions)
    } else {
      const errorMessage =
        '↳ ❌  Publishing manually cancelled. Pblishing aborted.'
      if (jest) {
        console.error(errorMessage)
      } else {
        throw new Error(errorMessage)
      }
    }

    try {
      await postpublish({ ...publishOptions, postpublishHook })
    } catch (error) {
      console.error(`↳ ⚠️  Postpublish hooks failed: ${error.message}`)
    }
  }).output
}

module.exports = manualPublish
