const isUsingDevStyleguidist = () => {
  const buildEnv = process.env.BUILD_ENV
  return buildEnv === 'watch-styleguidist'
}

module.exports = {
  isUsingDevStyleguidist
}
