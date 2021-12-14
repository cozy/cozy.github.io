import { Q } from 'cozy-client'
import flag from 'cozy-flags'

import { JOBS_DOCTYPE } from 'doctypes'
import { logger } from 'ducks/konnectorAlerts'

export const setIgnoredErrorsFlag = async client => {
  const triggerId = process.env.COZY_TRIGGER_ID
  const jobId = process.env.COZY_JOB_ID?.split('/').pop()

  logger(
    'info',
    `Executing job notifications service by trigger: ${triggerId}, job: ${jobId}...`
  )

  try {
    const { data: serviceJob } = await client.query(
      Q(JOBS_DOCTYPE).getById(jobId)
    )
    const forcedIgnoredErrors = serviceJob?.message?.forceIgnoredErrors

    if (forcedIgnoredErrors) {
      flag('banks.konnector-alerts.ignored-errors', forcedIgnoredErrors)
      logger(
        'info',
        `Forced flag banks.konnector-alerts.ignored-errors to: ${forcedIgnoredErrors}`
      )
    } else {
      logger('info', 'Flag banks.konnector-alerts.ignored-errors not forced')
    }
  } catch (e) {
    logger(
      'error',
      `❗ Error when getting job with id: ${jobId}, reason: ${e.message}`
    )
  }
}
