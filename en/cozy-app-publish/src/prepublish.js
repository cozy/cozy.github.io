const runHooks = require('./runhooks')
const request = require('request')
const crypto = require('crypto')
const logger = require('./utils/logger')

/**
 * Returns only expected value, avoid data injection by hook
 */
const sanitize = options => {
  const {
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

const optionsTypes = {
  appBuildUrl: [isRequired],
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
      if (!validator[0](options[option])) {
        throw new Error(validator[1](option))
      }
    })
  }

  return options
}

const shasum256FromURL = url =>
  new Promise((resolve, reject) => {
    const hasher = crypto.createHash('sha256').setEncoding('hex')
    const req = request(url)
      .on('error', reject)
      .pipe(hasher)
      .on('error', reject)
      .on('finish', () => {
        resolve(hasher.read())
      })

    req.on('error', e => {
      reject(e)
    })
  })

const shasum = async options => {
  const { appBuildUrl } = options
  try {
    logger.log('Verifying shasum...')
    const shasum = await prepublish.shasum256FromURL(appBuildUrl)
    options.sha256Sum = shasum
  } catch (e) {
    throw new Error('Cannot shasum ' + appBuildUrl)
  }
  return options
}

const prepublish = async options =>
  shasum(
    check(sanitize(await runHooks(options.prepublishHook, 'pre', options)))
  )

module.exports = prepublish
prepublish.shasum256FromURL = shasum256FromURL
