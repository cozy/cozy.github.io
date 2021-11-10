import { TRIGGER_DOCTYPE } from 'doctypes'
import { logger } from 'ducks/konnectorAlerts'
import { ONE_DAY } from 'ducks/recurrence/constants'
import { getTriggerStates, fetchRelatedAtTriggers } from './helpers'

const dateInDays = (referenceDate, n) => {
  return new Date(+new Date(referenceDate) + n * ONE_DAY)
}

const createTriggerAt = async ({ client, date, konnectorTriggerId }) => {
  try {
    await client.save({
      _type: TRIGGER_DOCTYPE,
      type: '@at',
      arguments: date.toISOString(),
      worker: 'service',
      message: {
        name: 'konnectorAlerts',
        slug: 'banks',
        konnectorTriggerId,
        forceIgnoredErrors: 'manual-job,last-failure-already-notified'
      }
    })
    logger(
      'info',
      `⭐ Created: new @at trigger at ${date.toISOString().split('T')[0]}`
    )
  } catch (error) {
    logger('error', `❗ Error when creating new @at trigger: ${error.message}`)
  }
}

export const containerForTesting = {
  createTriggerAt
}

export const createScheduledTrigger = async client => {
  const settingTriggerStates = await getTriggerStates(client)

  for (const [id, triggerStates] of Object.entries(settingTriggerStates)) {
    logger(
      'info',
      `⌛ Try to create @at triggers for konnectorTriggerId: ${id}...`
    )

    if (triggerStates?.status !== 'errored') {
      logger('info', `⚠️  Not created: this konnector trigger isn't in error`)
      continue
    }

    if (
      triggerStates?.shouldNotify?.reason !== 'last-failure-already-notified'
    ) {
      logger(
        'info',
        `⚠️  Not created: this konnector trigger doesn't match last-failure-already-notified condition`
      )
      continue
    }

    const relatedAtTriggers = await fetchRelatedAtTriggers(client, id)

    if (relatedAtTriggers.length > 0) {
      logger(
        'info',
        `⚠️  Not created: @at triggers already existing for this konnector trigger`
      )
      continue
    }

    await containerForTesting.createTriggerAt({
      client,
      date: dateInDays(triggerStates.last_failure, 3),
      konnectorTriggerId: id
    })
    await containerForTesting.createTriggerAt({
      client,
      date: dateInDays(triggerStates.last_failure, 7),
      konnectorTriggerId: id
    })
  }
}
