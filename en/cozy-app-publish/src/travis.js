const path = require('path')

const publisher = require('./publisher')
const tags = require('./tags')
const { getDevVersion } = require('./tags')
const getManifestAsObject = require('./utils/getManifestAsObject')
const getTravisVariables = require('./utils/getTravisVariables')

const getAutoTravisVersion = async ctx => {
  const tag = getRelevantTagTravis(ctx)
  const { TRAVIS_COMMIT } = getTravisVariables()
  if (tag) {
    return tag
  } else {
    const shortCommit = TRAVIS_COMMIT.slice(0, 7)
    return await getDevVersion(ctx.appManifestObj.version, shortCommit)
  }
}

const getRelevantTagTravis = ctx => {
  const { TRAVIS_TAG } = getTravisVariables()
  const parsed = tags.parse(TRAVIS_TAG)
  if (ctx.tagPrefix) {
    if (parsed.prefix === ctx.tagPrefix) {
      return TRAVIS_TAG
    }
  } else {
    return TRAVIS_TAG
  }
}

const getAppBuildURLFromTravis = ctx => {
  const { TRAVIS_REPO_SLUG, TRAVIS_COMMIT } = getTravisVariables()
  const tag = getRelevantTagTravis(ctx)
  // get archive url from github repo
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  const buildUrl = ctx.buildUrl
  const buildCommit = ctx.buildCommit
  const githubUrl = `https://github.com/${TRAVIS_REPO_SLUG}/archive`
  const buildHash = buildCommit || TRAVIS_COMMIT
  if (buildUrl) {
    return buildUrl
  } else if (!buildCommit && tag) {
    // if we use --build-commit => we are not on the build branch
    // so we can't use this branch tag directly for the url
    // if not, we suppose that we are on the build tagged branch here
    return `${githubUrl}/${tag}.tar.gz`
  } else {
    return `${githubUrl}/${buildHash}.tar.gz`
  }
}

const getTravisRegistryToken = () => {
  const { REGISTRY_TOKEN } = getTravisVariables()
  return REGISTRY_TOKEN
}

const getManifestTravis = ctx => {
  const { TRAVIS_BUILD_DIR } = getTravisVariables()
  const p = path.join(TRAVIS_BUILD_DIR, ctx.buildDir)
  return getManifestAsObject(p)
}

const travisPublish = publisher({
  getManifest: getManifestTravis,
  getAppBuildURL: getAppBuildURLFromTravis,
  getAppVersion: getAutoTravisVersion,
  getRegistryToken: getTravisRegistryToken,
  showConfirmation: false
})

module.exports = travisPublish
