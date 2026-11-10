const crypto = require('crypto')
const fs = require('fs')

const runHooks = require('./runhooks')
const logger = require('./utils/logger')

/**
 * Returns only expected value, avoid data injection by hook
 */
const sanitize = options => {
  const {
    appBuildFile,
    appBuildUrl,
    appSlug,
    appType,
    appVersion,
    buildCommit,
    registryUrl,
    registryEditor,
    registryToken,
    spaceName
  } = options

  return {
    appBuildFile,
    appBuildUrl,
    appSlug,
    appType,
    appVersion,
    buildCommit,
    registryUrl,
    registryEditor,
    registryToken,
    spaceName
  }
}

const isRequiredFromManifest = manifestAttribute => [
  field => typeof field !== 'undefined',
  () => `Property ${manifestAttribute} must be defined in manifest.`
]

const isRequired = [
  field => typeof field !== 'undefined',
  key => `Option ${key} is required.`
]

const isOneOf = values => [
  field => values.includes(field),
  key => `${key} should be one of the following values: ${values.join(', ')}`
]

const isBuildRequired = [
  (field, options) =>
    typeof field !== 'undefined' || typeof options.appBuildFile !== 'undefined',
  () => 'Option appBuildUrl or appBuildFile is required.'
]

const optionsTypes = {
  appBuildUrl: [isBuildRequired],
  appSlug: [isRequiredFromManifest('slug')],
  appType: [isRequiredFromManifest('type'), isOneOf(['webapp', 'konnector'])],
  appVersion: [isRequired],
  registryUrl: [isRequired],
  registryEditor: [isRequired],
  registryToken: [isRequired]
}

/**
 * Check if all expected options are defined
 */
const check = options => {
  for (const option in optionsTypes) {
    const validators = optionsTypes[option]
    validators.forEach(validator => {
      if (!validator[0](options[option], options)) {
        throw new Error(validator[1](option))
      }
    })
  }

  return options
}

const shasum256FromURL = async url => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Cannot download ${url}: ${res.status}`)
  }
  const hash = crypto.createHash('sha256')
  for await (const chunk of res.body) hash.update(chunk)
  return hash.digest('hex')
}

const shasum256FromFile = async filePath => {
  const hash = crypto.createHash('sha256')
  for await (const chunk of fs.createReadStream(filePath)) hash.update(chunk)
  return hash.digest('hex')
}

const shasum = async options => {
  const { appBuildUrl, appBuildFile } = options
  const source = appBuildFile || appBuildUrl
  try {
    logger.log(`Verifying shasum of ${source}...`)
    options.sha256Sum = appBuildFile
      ? await prepublish.shasum256FromFile(appBuildFile)
      : await prepublish.shasum256FromURL(appBuildUrl)
  } catch (_e) {
    throw new Error('Cannot shasum ' + source, { cause: _e })
  }
  return options
}

const prepublish = async options => {
  const hookedOptions = sanitize(
    await runHooks(options.prepublishHook, 'pre', options)
  )
  return shasum(check(hookedOptions))
}

module.exports = prepublish
prepublish.shasum256FromURL = shasum256FromURL
prepublish.shasum256FromFile = shasum256FromFile
