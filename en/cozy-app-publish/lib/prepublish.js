const runHooks = require('../utils/runhooks')
const spawn = require('cross-spawn')

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

/**
 * Check if all expected options are defined
 */
const check = options => {
  ;[
    'appBuildUrl',
    'appSlug',
    'appType',
    'appVersion',
    'registryUrl',
    'registryEditor',
    'registryToken'
  ].forEach(option => {
    if (typeof options[option] === 'undefined') {
      throw new Error(`${option} cannot be undefined`)
    }
  })

  return options
}

const shasum = options => {
  const { appBuildUrl, verbose } = options
  // get the sha256 hash from the archive from the url
  const shaSumProcess = spawn.sync(
    'sh',
    ['-c', `curl -sSL --fail "${appBuildUrl}" | shasum -a 256 | cut -d" " -f1`],
    {
      stdio: verbose ? 'inherit' : 'pipe'
    }
  )
  // Note: if the Url don't return an archive or if 404 Not found,
  // the shasum will be the one of the error message from the curl command
  // so no error throwed here whatever the url is
  if (shaSumProcess.status !== 0) {
    throw new Error(
      `Error from archive shasum computing (${appBuildUrl}). Publishing failed.`
    )
  }
  // remove also the ending line break
  options.sha256Sum = shaSumProcess.stdout.toString().replace(/\r?\n|\r/g, '')
  return options
}

module.exports = async options =>
  shasum(
    check(sanitize(await runHooks(options.prepublishHook, 'pre', options)))
  )
