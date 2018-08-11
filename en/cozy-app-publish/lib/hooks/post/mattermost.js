const https = require('https')
const hookHelpers = require('../helpers')
const url = require('url')

const MATTERMOST_CHANNEL = process.env.MATTERMOST_CHANNEL
const MATTERMOST_HOOK_URL = process.env.MATTERMOST_HOOK_URL
const MATTERMOST_ICON =
  'https://travis-ci.com/images/logos/TravisCI-Mascot-1.png'
const MATTERMOST_USERNAME = 'Travis'

const sendMattermostReleaseMessage = (appSlug, appVersion, instances) => {
  let message = `__${appSlug}__ version \`${appVersion}\` has been published`

  if (instances.length) {
    message = `${message} and deployed on following instances: ${instances
      .map(instance => `[${instance}](http://${instance})`)
      .join(', ')}.`
  } else {
    message = `${message}.`
  }

  const mattermostHookUrl = url.parse(MATTERMOST_HOOK_URL)

  return new Promise((resolve, reject) => {
    console.log(
      `↳ ℹ️  Sending to mattermost channel ${MATTERMOST_CHANNEL} the following message: "${message}"`
    )
    const postData = `payload=${JSON.stringify({
      channel: MATTERMOST_CHANNEL,
      icon_url: MATTERMOST_ICON,
      username: MATTERMOST_USERNAME,
      text: message
    })}`

    const request = https.request(
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
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
              `Mattermost message sending failed (error status: ${
                res.statusCode
              }).`
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

module.exports = async options => {
  console.log('↳ ℹ️  Sending message to Mattermost')

  if (!MATTERMOST_CHANNEL) {
    throw new Error('No MATTERMOST_CHANNEL environment variable defined')
  }

  if (!MATTERMOST_HOOK_URL) {
    throw new Error('No MATTERMOST_HOOK_URL environment variable defined')
  }

  const { appSlug, appVersion } = options

  const instances = hookHelpers.getEnvInstances(
    hookHelpers.getChannel(appVersion)
  )

  sendMattermostReleaseMessage(appSlug, appVersion, instances)

  return options
}
