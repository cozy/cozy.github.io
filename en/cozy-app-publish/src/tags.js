const git = require('./git')

const getDevVersion = async (pkgVersion, shortCommit_) => {
  const shortCommit = shortCommit_ || (await git.getShortCommit())
  return `${pkgVersion}-dev.${shortCommit}${Date.now()}`
}

const PREFIX = String.raw`([a-z-]+)/`
const VERSION = String.raw`(?:v)?(\d+\.\d+\.\d+)`
const BETA = String.raw`-beta.(\d{1,4})`
const DEV = String.raw`-dev\.([a-z0-9]+)`
const COMPLETE = new RegExp(`^(?:${PREFIX})?${VERSION}(?:${BETA})?(?:${DEV})?$`)

/**
 * Returns a structured version of a git version tag.
 * If the tag can be parsed, returns an object containing :
 *   prefix, channel, beta, dev, version, fullVersion
 *
 * If the tag cannot be parsed, returns null.
 */
const parse = tag => {
  if (!tag) {
    return null
  }
  const match = tag.match(COMPLETE)
  if (!match) {
    return null
  } else {
    const prefix = match[1]
    const version = match[2]
    const beta = match[3]
    const dev = match[4]
    if (beta && dev) {
      throw new Error(`Invalid tag ${tag}, beta and dev are present`)
    }
    const channel = dev ? 'dev' : beta ? 'beta' : 'stable'
    return {
      prefix,
      channel: channel,
      beta: beta ? parseInt(beta) : null,
      dev: dev || null,
      version, // 1.0.17
      fullVersion: `${version}${
        channel !== 'stable' ? `-${channel}.${beta || dev}` : ''
      }`, // 1.0.17-beta.2
      tag
    }
  }
}

const assertOKWithVersion = (tagInfo, pkgVersion) => {
  if (!tagInfo.dev && tagInfo.version && tagInfo.version !== pkgVersion) {
    throw new Error(
      `The version number is different between package.json (${pkgVersion}) and tag (${tagInfo.version})`
    )
  }
}

/**
 * Returns the version to be published.
 * If no tag is present on the current commit, returns a dev version made
 * from the package.json version + commit + date.
 *
 * If it is not a dev version, it throws if the tag does not correspond
 * to the `pkgVersion`
 */
const getVersionTags = async () => {
  const currentTags = await git.getCurrentTags()
  return currentTags.map(parse).filter(Boolean)
}

const main = async () => {
  const tags = await getVersionTags()
  console.log(tags)
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}

module.exports = {
  getVersionTags,
  getDevVersion,
  parse,
  assertOKWithVersion
}
