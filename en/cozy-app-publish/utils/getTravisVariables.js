function getTravisVariables() {
  // values from process.env are always string
  const getEnv = name => process.env[name]

  return {
    TRAVIS_BUILD_DIR: getEnv('TRAVIS_BUILD_DIR'),
    TRAVIS_TAG: getEnv('TRAVIS_TAG'),
    TRAVIS_COMMIT: getEnv('TRAVIS_COMMIT'),
    TRAVIS_REPO_SLUG: getEnv('TRAVIS_REPO_SLUG'),
    // encrypted variables
    REGISTRY_TOKEN: getEnv('REGISTRY_TOKEN')
  }
}

module.exports = getTravisVariables
