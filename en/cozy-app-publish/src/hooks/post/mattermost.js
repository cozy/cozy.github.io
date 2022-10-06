const https = require('https')
const url = require('url')
const tags = require('../../tags')
const logger = require('../../utils/logger')

const appTypeLabelMap = {
  webapp: 'Application',
  konnector: 'Connector'
}

const makeGithubCommitsURL = (repoSlug, commitSha) => {
  return `https://github.com/${repoSlug}/commits/${commitSha}`
}

const getMessage = options => {
  const { appSlug, appVersion, spaceName, appType } = options
  const {
    TRAVIS_COMMIT_MESSAGE,
    TRAVIS_JOB_WEB_URL,
    TRAVIS_REPO_SLUG,
    TRAVIS_COMMIT
  } = process.env
  const spaceMessage = spaceName ? ` on space __${spaceName}__` : ''
  const infos = [
    TRAVIS_COMMIT_MESSAGE
      ? `- [Last commit: ${
          TRAVIS_COMMIT_MESSAGE.split('\n')[0]
        }](${makeGithubCommitsURL(TRAVIS_REPO_SLUG, TRAVIS_COMMIT)})`
      : null,
    TRAVIS_JOB_WEB_URL ? `- [Job](${TRAVIS_JOB_WEB_URL})` : null
  ]
    .filter(Boolean)
    .join('\n')
  const message = `${
    appTypeLabelMap[appType] || ''
  } __${appSlug}__ version \`${appVersion}\` has been published${spaceMessage}.${
    infos.length > 0 ? '\n\n' + infos : ''
  }`
  return message
}

const sendMattermostMessage = options => {
  const { channel, iconURL, hookURL, username, message } = options

  const mattermostHookUrl = url.parse(hookURL)

  return new Promise((resolve, reject) => {
    logger.log(
      `↳ ℹ️  Sending to mattermost channel ${channel} the following message: "${message}"`
    )
    const postData = JSON.stringify({
      channel: channel,
      icon_url: iconURL,
      username: username,
      text: message
    })

    const request = https.request(
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        hostname: mattermostHookUrl.hostname,
        method: 'post',
        path: mattermostHookUrl.pathname
      },
      res => {
        if (res.statusCode === 200) {
          resolve(res)
        } else {
          reject(
            new Error(
              `Mattermost message sending failed (error status: ${res.statusCode}) and message : ${res.statusMessage}.`
            )
          )
        }
      }
    )
    request.on('error', error => reject(error))
    request.write(postData)
    request.end()
  })
}

const validate = () => {
  if (!process.env.MATTERMOST_HOOK_URL) {
    throw new Error('No MATTERMOST_HOOK_URL environment variable defined')
  } else if (!process.env.MATTERMOST_CHANNEL) {
    throw new Error('No MATTERMOST_CHANNEL environment variable defined')
  }
}

const getMattermostChannels = ({ appVersion }) => {
  const tagInfo = tags.parse(appVersion)
  const envChannel = process.env.MATTERMOST_CHANNEL
  let channelOptions
  try {
    channelOptions = JSON.parse(envChannel)
  } catch (e) {
    channelOptions = {
      dev: envChannel,
      beta: envChannel,
      stable: envChannel
    }
  }
  const channels = channelOptions[tagInfo.channel]
  return channels && channels.length > 0 ? channels.split(',') : []
}

const sendMattermostReleaseMessage = async options => {
  validate()

  const hookURL = process.env.MATTERMOST_HOOK_URL
  const channels = getMattermostChannels({ appVersion: options.appVersion })
  const iconURL = 'https://files.cozycloud.cc/travis.png'
  const username = 'Travis'
  const message = getMessage(options)
  for (const channel of channels) {
    logger.log('↳ ℹ️  Sending message to Mattermost')
    await sendMattermostMessage({
      hookURL,
      iconURL,
      username,
      channel,
      message
    })
  }
}

module.exports = sendMattermostReleaseMessage
module.exports.getMessage = getMessage
module.exports.sendMattermostMessage = sendMattermostMessage
module.exports.sendMattermostReleaseMessage = sendMattermostReleaseMessage

if (require.main === module) {
  const args = process.argv.slice(2)
  const appVersion = args[0]
  const appSlug = 'test'
  const spaceName = 'spacemountain'
  const appType = 'konnector'
  sendMattermostReleaseMessage({
    appSlug,
    appVersion,
    spaceName,
    appType
  }).catch(e => {
    logger.error(e)
    process.exit(1)
  })
}
