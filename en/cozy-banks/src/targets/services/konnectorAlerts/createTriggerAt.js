import { TRIGGER_DOCTYPE } from 'doctypes'
import { logger } from 'ducks/konnectorAlerts'
import {
  add,
  getTriggerStates,
  fetchRelatedFuturAtTriggers
} from 'targets/services/konnectorAlerts/helpers'

const createTriggerAt = async ({ client, date, konnectorTriggerId }) => {
  try {
    if (date <= add(Date.now(), { days: 2 })) {
      // If the date is in the past or too close to the current execution of the
      // service, we don't create a trigger.
      logger(
        'info',
        '@at trigger not created: this konnector trigger would be too close to this execution (less than 2 days)'
      )
      return
    }

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

    if (triggerStates?.shouldNotify?.ok !== true) {
      logger(
        'info',
        `@at triggers not created: this konnector trigger doesn't sent any notification`
      )
      continue
    }

    const relatedFuturAtTriggers = await fetchRelatedFuturAtTriggers(client, id)

    if (relatedFuturAtTriggers.length > 0) {
      logger(
        'info',
        `@at triggers not created: @at triggers already existing in the future for this konnector trigger`
      )
      continue
    }

    await containerForTesting.createTriggerAt({
      client,
      date: add(triggerStates.last_failure, { days: 3 }),
      konnectorTriggerId: id
    })
    await containerForTesting.createTriggerAt({
      client,
      date: add(triggerStates.last_failure, { days: 7 }),
      konnectorTriggerId: id
    })
  }
}
