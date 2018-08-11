// Registry channels
const DEV = 'dev'
const BETA = 'beta'
const STABLE = 'stable'

const ENV_TARGETS = {
  [DEV]: process.env.TARGETS_DEV || '',
  [BETA]: process.env.TARGETS_BETA || '',
  [STABLE]: (process.env.TARGETS_STABLE || '').concat(
    process.env.TARGETS_BETA || ''
  )
}

const getChannel = version => {
  if (!version) throw new Error('App version is not specified')
  if (version.includes('-dev.')) return DEV
  if (version.includes('-beta.')) return BETA
  if (version.match(/\d+\.\d+\.\d+/)) return STABLE
  throw new Error('Unrecognized version channel')
}

const getEnvInstances = channel =>
  ENV_TARGETS[channel] && ENV_TARGETS[channel].replace(' ', '').split(',')

const getInstanceDomain = instance => {
  return instance
    .split('.')
    .slice(1)
    .join('.')
}

module.exports = {
  getChannel,
  getEnvInstances,
  getInstanceDomain
}
