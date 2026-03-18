const defaults = require('lodash/defaults')
const { VError } = require('verror')

const promptConfirm = require('./confirm')
const constants = require('./constants')
const postpublish = require('./postpublish')
const prepublish = require('./prepublish')
const publish = require('./publish')
const colorize = require('./utils/colorize')
const logger = require('./utils/logger')

const { DEFAULT_REGISTRY_URL, DEFAULT_BUILD_DIR, DEFAULT_SPACE_NAME } =
  constants

const publisher =
  ({
    getManifest,
    getAppVersion,
    showConfirmation,
    getAppBuildURL,
    getRegistryToken
  }) =>
  async ctxArg => {
    const ctx = { ...ctxArg }

    defaults(ctx, {
      buildDir: DEFAULT_BUILD_DIR,
      registryUrl: DEFAULT_REGISTRY_URL,
      registryToken: getRegistryToken ? getRegistryToken() : undefined,
      spaceName: DEFAULT_SPACE_NAME
    })

    const {
      buildDir,
      buildCommit,
      postpublishHook,
      prepublishHook,
      registryToken,
      registryUrl,
      spaceName,
      yes
    } = ctx

    // registry editor token (required)
    if (!registryToken) {
      throw new Error('Registry token is missing. Publishing failed.')
    }

    // application manifest (required)
    const appManifestObj = getManifest(ctx)
    ctx.appManifestObj = appManifestObj

    // registry editor (required)
    const registryEditor = appManifestObj.editor
    if (!registryEditor) {
      throw new Error(
        'Registry editor is missing in the manifest. Publishing failed.'
      )
    }

    // other variables
    const appSlug = appManifestObj.slug
    const appType = appManifestObj.type || 'webapp'

    // get application version to publish
    const appVersion = await getAppVersion(ctx)
    const appBuildUrl = getAppBuildURL ? getAppBuildURL(ctx) : ctx.appBuildUrl

    logger.log(
      `Will publish ${colorize.bold(appSlug)}@${colorize.bold(
        appVersion
      )} to ${colorize.bold(registryUrl)} (space: ${
        spaceName || 'default one'
      })`
    )

    if (showConfirmation && !yes) {
      const goFurther = await promptConfirm(
        'Are you sure you want to publish this application above?'
      )
      if (!goFurther) {
        logger.log('Publishing cancelled')
        return
      }
    }

    let publishOptions
    try {
      publishOptions = await prepublish({
        buildDir,
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
    } catch (error) {
      throw new VError(error, 'Prepublish failed')
    }

    if (!appBuildUrl && publishOptions.appBuildUrl) {
      logger.log(
        `Uploaded app to ${publishOptions.appBuildUrl} (sha256 ${colorize.bold(
          publishOptions.sha256Sum
        )})`
      )
    }

    try {
      await publish(publishOptions)
    } catch (error) {
      throw new VError(error, 'Publish failed')
    }

    try {
      await postpublish({ ...publishOptions, postpublishHook })
    } catch (error) {
      throw new VError(error, 'Postpublish hooks failed')
    }
  }

module.exports = publisher
