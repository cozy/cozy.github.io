import uniq from 'lodash/uniq'
import fromPairs from 'lodash/fromPairs'
import get from 'lodash/get'

import { Q } from 'cozy-client'
import flag from 'cozy-flags'
import { sendNotification } from 'cozy-notifications'

import { TRIGGER_DOCTYPE } from 'doctypes'
import { logger } from 'ducks/konnectorAlerts'
import {
  getKonnectorSlug,
  fetchRegistryInfo,
  buildNotification,
  storeTriggerStates,
  fetchTriggerStates
} from './helpers'
import { shouldNotify } from './shouldNotify'

/**
 * Fetches triggers, filters those for which we can send a notification, and send
 * notifications.
 *
 * @param  {CozyClient} client - Cozy client
 * @return {Promise}
 */
export const sendTriggerNotifications = async client => {
  const { data: cronKonnectorTriggers } = await client.query(
    Q(TRIGGER_DOCTYPE).where({
      worker: 'konnector'
    })
  )
  logger('info', `${cronKonnectorTriggers.length} konnector triggers`)

  const triggerStatesDoc = await fetchTriggerStates(client)
  const previousStates = get(triggerStatesDoc, 'triggerStates', {})

  const ignoredErrorFlag = flag('banks.konnector-alerts.ignored-errors')
  const ignoredErrors = new Set(
    ignoredErrorFlag ? ignoredErrorFlag.split(',') : []
  )

  const cronKonnectorTriggersAndNotifsInfo = await Promise.all(
    cronKonnectorTriggers.map(async trigger => {
      return {
        trigger,
        shouldNotify: await shouldNotify({
          client,
          trigger,
          previousStates
        })
      }
    })
  )

  const willBeNotifiedTriggers = cronKonnectorTriggersAndNotifsInfo.filter(
    ({ trigger, shouldNotify }) => {
      if (shouldNotify.ok || ignoredErrors.has(shouldNotify.reason)) {
        logger('info', `Will notify trigger for ${getKonnectorSlug(trigger)}`)
        return true
      } else {
        logger(
          'info',
          `Will not notify trigger for ${getKonnectorSlug(trigger)} because ${
            shouldNotify.reason
          }`
        )
        return false
      }
    }
  )

  const konnectorSlugs = uniq(
    willBeNotifiedTriggers.map(({ trigger }) => getKonnectorSlug(trigger))
  )

  const konnectorNamesBySlug = fromPairs(
    await Promise.all(
      konnectorSlugs.map(async slug => [
        slug,
        get(
          await fetchRegistryInfo(client, slug),
          'latest_version.manifest.name',
          slug
        )
      ])
    )
  )

  logger(
    'warn',
    `${willBeNotifiedTriggers.length} konnector triggers to notify`
  )

  if (willBeNotifiedTriggers.length) {
    const konnectorAlerts = willBeNotifiedTriggers.map(({ trigger }) => {
      const konnectorSlug = trigger.message.konnector
      return {
        konnectorSlug,
        konnectorName: konnectorNamesBySlug[konnectorSlug] || konnectorSlug,
        trigger
      }
    })

    const notification = buildNotification(client, { konnectorAlerts })
    if (flag('banks.konnector-alerts.notification.disable')) {
      logger(
        'warn',
        'Abort sending notification because of flag "banks.konnector-alerts.notification.disable"'
      )
    } else {
      await sendNotification(client, notification)
    }
  }

  await storeTriggerStates(
    client,
    cronKonnectorTriggersAndNotifsInfo,
    triggerStatesDoc
  )
}
