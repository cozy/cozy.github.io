const spawn = require('child_process').spawn

const logger = require('./utils/logger')

const launchCmd = (cmd, params, options) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const result = { stdout: [], stderr: [] }
    const cmdOptions = { encoding: 'utf8', ...options }
    const process = await spawn(cmd, params, cmdOptions)
    process.stdout.on('data', data => result.stdout.push(data.toString()))
    process.stderr.on('data', data => result.stderr.push(data.toString()))
    process.on('close', code => {
      result.code = code
      if (code === 0) {
        resolve(result)
      } else {
        reject(result)
      }
    })
  })
}

const getCommitHash = async () => {
  const result = await launchCmd('git', ['rev-parse', 'HEAD'])
  return result.stdout[0].replace('\n', '')
}

const getShortCommit = async () => {
  const commit = await getCommitHash()
  return commit.slice(0, 7)
}

const getCurrentTags = async () => {
  try {
    // get tag on head commit
    const result = await launchCmd('git', ['tag', '-l', '--points-at', 'HEAD'])
    if (result.stdout.length === 0) {
      logger.info('No tags')
      return []
    }
    const gitTags = result.stdout.join('').split('\n').filter(Boolean)

    logger.info('Current tags: ', gitTags.join(', '))
    return gitTags
  } catch (e) {
    logger.error(`\n⚠️  Erreur lors de la récupération du tag :\n`)
    logger.error(' ', e.stderr ? e.stderr : e, '\n')
    process.exit(1)
  }
}

module.exports = {
  launchCmd,
  getCommitHash,
  getShortCommit,
  getCurrentTags
}
