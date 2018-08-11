const https = require('https')
const hookHelpers = require('../helpers')

const RUNDECK_TOKEN = process.env.RUNDECK_TOKEN

const RUNDECK_JOBS = {
  'cozy.works': '87a668f7-eff1-422d-aa84-92b3bcc62c8f',
  'cozy.rocks': 'ad27f2f6-63d9-4a16-ab62-e25c957875b5',
  'mycozy.cloud': '87a668f7-eff1-422d-aa84-92b3bcc62c8f'
}

const runRundeckJob = (token, instance, slug) =>
  new Promise((resolve, reject) => {
    const job = RUNDECK_JOBS[hookHelpers.getInstanceDomain(instance)]

    if (!job) {
      console.log(`↳ ⚠️  No rundeck job available for ${instance}`)
      reject(new Error(`Invalid domain name ${instance}`))
    }

    console.log(`↳ ℹ️  Updating ${slug} on ${instance} (Job ID: ${job})`)
    const request = https.request(
      {
        headers: {
          'X-Rundeck-Auth-Token': token
        },
        hostname: 'rundeck.cozycloud.cc',
        method: 'POST',
        path: encodeURI(
          `/api/20/job/${job}/run?argString=-instance+${instance}+-slugs+${slug}`
        )
      },
      res => {
        if (res.statusCode === 200) {
          resolve(res)
        } else {
          reject(new Error(`Rundeck response error ${res.statusCode}`))
        }
      }
    )

    request.on('error', error => reject(error))
    request.end()
  })

module.exports = async options => {
  console.log('↳ ℹ️  Updating target instances using Rundeck')

  if (!RUNDECK_TOKEN) {
    throw new Error('No environment variable RUNDECK_TOKEN defined')
  }

  const { appSlug, appVersion } = options

  // Check if version is dev, beta, or stable.
  const channel = hookHelpers.getChannel(appVersion)
  const instances = hookHelpers.getEnvInstances(channel)

  if (!instances) {
    console.log(`↳ ℹ️  No instance to upgrade for channel ${channel}`)
    return options
  }

  console.log(
    `↳ ℹ️  Updating channel ${channel} in instances ${instances.join(', ')}`
  )

  const failedDeployments = []

  for (const instance of instances) {
    try {
      await runRundeckJob(RUNDECK_TOKEN, instance, appSlug)
    } catch (e) {
      failedDeployments.push({
        appSlug,
        error: e.message,
        instance
      })
    }
  }

  if (failedDeployments.length) {
    throw new Error(
      `Failed to execute following rundeck jobs: ${failedDeployments
        .map(
          deployment =>
            `${deployment.appSlug} on ${deployment.instance} : ${
              deployment.error
            }`
        )
        .join(', ')}`
    )
  }

  return options
}
