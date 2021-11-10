import { Q } from 'cozy-client'
import flag from 'cozy-flags'

import { TRIGGER_DOCTYPE, JOBS_DOCTYPE } from 'doctypes'
import { logger } from 'ducks/konnectorAlerts'
import { runService } from './service'
import { sendTriggerNotifications } from './konnectorAlerts/sendTriggerNotifications'
import { createScheduledTrigger } from './konnectorAlerts/createTriggerAt'

const main = async ({ client }) => {
  client.registerPlugin(flag.plugin)
  await client.plugins.flags.refresh()

  if (!flag('banks.konnector-alerts')) {
    logger(
      'info',
      'Bailing out of job notifications service since flag "banks.konnector-alerts" is not set'
    )
    return
  }

  let serviceTrigger = undefined
  let serviceJob = undefined
  const triggerId = process.env.COZY_TRIGGER_ID
  const jobId = process.env.COZY_JOB_ID?.split('/').pop()

  logger(
    'info',
    `Executing job notifications service by trigger: ${triggerId}, job: ${jobId}...`
  )

  try {
    const { data } = await client.query(Q(TRIGGER_DOCTYPE).getById(triggerId))
    serviceTrigger = data
  } catch (e) {
    logger(
      'error',
      `❗ Error when getting trigger with id: ${triggerId}, reason: ${e.message}`
    )
  }

  try {
    const { data } = await client.query(Q(JOBS_DOCTYPE).getById(jobId))
    serviceJob = data
  } catch (e) {
    logger(
      'error',
      `❗ Error when getting job with id: ${jobId}, reason: ${e.message}`
    )
  }

  const forcedIgnoredErrors =
    serviceTrigger?.message?.forceIgnoredErrors ||
    serviceJob?.message?.forceIgnoredErrors

  if (forcedIgnoredErrors) {
    flag('banks.konnector-alerts.ignored-errors', forcedIgnoredErrors)
    logger(
      'info',
      `Forced flag banks.konnector-alerts.ignored-errors to: ${forcedIgnoredErrors}`
    )
  }

  await sendTriggerNotifications(client)
  await createScheduledTrigger(client)
}

if (require.main === module || process.env.NODE_ENV === 'production') {
  runService(main)
}

export default main
