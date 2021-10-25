import mapValues from 'lodash/mapValues'
import keyBy from 'lodash/keyBy'
import uniq from 'lodash/uniq'
import fromPairs from 'lodash/fromPairs'
import get from 'lodash/get'
import memoize from 'lodash/memoize'

import { Q } from 'cozy-client'
import flag from 'cozy-flags'
import { sendNotification } from 'cozy-notifications'

import { TRIGGER_DOCTYPE, JOBS_DOCTYPE, SETTINGS_DOCTYPE } from 'doctypes'
import { runService, dictRequire, lang } from './service'
import { KonnectorAlertNotification, logger } from 'ducks/konnectorAlerts'
import { ONE_DAY } from 'ducks/recurrence/constants'

const TRIGGER_STATES_DOC_ID = 'trigger-states'

const getKonnectorSlug = trigger => trigger.message.konnector

/** Fetch triggers states from a special doc in the settings */
const fetchTriggerStates = async client => {
  try {
    const { data } = await client.query(
      Q(SETTINGS_DOCTYPE).getById(TRIGGER_STATES_DOC_ID)
    )
    return data
  } catch {
    return {}
  }
}

/** Stores triggers states in a special doc in the settings */
const storeTriggerStates = async (client, triggers, previousDoc) => {
  const triggerStatesById = mapValues(
    keyBy(triggers, '_id'),
    trigger => trigger.current_state
  )
  const doc = {
    _id: TRIGGER_STATES_DOC_ID,
    _type: SETTINGS_DOCTYPE,
    triggerStates: triggerStatesById
  }
  if (previousDoc && previousDoc._rev) {
    doc._rev = previousDoc._rev
  }
  return await client.save(doc)
}

const isErrorActionable = errorMessage => {
  return (
    errorMessage &&
    (errorMessage.startsWith('LOGIN_FAILED') ||
      errorMessage.startsWith('USER_ACTION_NEEDED'))
  )
}

const fetchRegistryInfo = memoize(
  async (client, konnectorSlug) => {
    try {
      return await client.stackClient.fetchJSON(
        'GET',
        `/registry/${konnectorSlug}`
      )
    } catch (e) {
      return {}
    }
  },
  (client, konnectorSlug) => konnectorSlug
)

const createTriggerAt = async (client, date) => {
  logger(
    'info',
    `Try to create new @at trigger for konnectorAlerts service at ${
      date.toISOString().split('T')[0]
    }...`
  )
  try {
    await client.save({
      _type: TRIGGER_DOCTYPE,
      type: '@at',
      arguments: date.toISOString(),
      worker: 'service',
      message: {
        name: 'konnectorAlerts',
        slug: 'banks'
      }
    })
    logger(
      'info',
      `⭐ Created: new @at trigger for konnectorAlerts service at ${
        date.toISOString().split('T')[0]
      }`
    )
  } catch (error) {
    logger(
      'error',
      `❗ Error when creating new @at trigger for konnectorAlerts service: ${error.message}`
    )
  }
}

export const containerForTesting = {
  createTriggerAt
}

const dateInDays = (referenceDate, n) => {
  return new Date(+new Date(referenceDate) + n * ONE_DAY)
}

/**
 * Returns whether we need to send a notification for a trigger
 *
 * @typedef {Object} ShouldNotifyResult
 * @property {number} ok - Whether the trigger generates a notification
 * @property {number} reason - If ok=false, describes why.
 *
 * @return {ShouldNotifyResult}
 */
export const shouldNotify = async ({
  client,
  trigger,
  previousStates,
  serviceTrigger
}) => {
  const previousState = previousStates[trigger._id]

  if (!previousState) {
    return { ok: false, reason: 'no-previous-state' }
  }

  if (trigger.current_state.status !== 'errored') {
    return { ok: false, reason: 'current-state-is-not-errored' }
  }

  if (!isErrorActionable(trigger.current_state.last_error)) {
    return { ok: false, reason: 'error-not-actionable' }
  }

  if (!trigger.current_state.last_success) {
    return { ok: false, reason: 'never-been-in-success' }
  }

  if (
    previousState.status === 'errored' &&
    isErrorActionable(previousState.last_error) &&
    serviceTrigger?.type !== '@at'
  ) {
    await containerForTesting.createTriggerAt(
      client,
      dateInDays(previousState.last_failure, 3)
    )
    await containerForTesting.createTriggerAt(
      client,
      dateInDays(previousState.last_failure, 7)
    )

    return { ok: false, reason: 'last-failure-already-notified' }
  }

  // We do not want to send notifications for jobs that were launched manually
  // Except if the trigger that runs the service is a scheduled one
  const jobId = trigger.current_state.last_executed_job_id
  const { data: job } = await client.query(Q(JOBS_DOCTYPE).getById(jobId))
  if (job.manual_execution && serviceTrigger?.type !== '@at') {
    return { ok: false, reason: 'manual-job' }
  }

  const registryInfo = await fetchRegistryInfo(
    client,
    getKonnectorSlug(trigger)
  )
  const categories = get(registryInfo, 'latest_version.manifest.categories')

  if (!categories || !categories.includes('banking')) {
    return { ok: false, reason: 'not-banking-konnector' }
  }

  if (registryInfo.maintenance_activated) {
    return { ok: false, reason: 'maintenance' }
  }

  return { ok: true }
}

/**
 * Build the notification for konnector alerts
 *
 * @param  {CozyClient} client - Cozy client
 * @param  {object} options - Options
 * @param  {Array.<KonnectorAlert>} options.konnectorAlerts - Alerts to include in the notification
 * @return {NotificationView} - The konnector alerts notification view
 */
export const buildNotification = (client, options) => {
  const notification = new KonnectorAlertNotification({
    client,
    lang,
    data: {},
    locales: {
      [lang]: dictRequire(lang)
    },
    ...options
  })
  return notification
}

/**
 * Fetches triggers, filters those for which we can send a notification, and send
 * notifications.
 *
 * @param  {CozyClient} client - Cozy client
 * @return {Promise}
 */
export const sendTriggerNotifications = async (client, serviceTrigger) => {
  const { data: cronKonnectorTriggers } = await client.query(
    Q(TRIGGER_DOCTYPE).where({
      worker: 'konnector'
    })
  )
  const triggerStatesDoc = await fetchTriggerStates(client)
  const previousStates = get(triggerStatesDoc, 'triggerStates', {})
  logger('info', `${cronKonnectorTriggers.length} konnector triggers`)

  const ignoredErrorFlag = flag('banks.konnector-alerts.ignored-errors')
  const ignoredErrors = new Set(
    ignoredErrorFlag ? ignoredErrorFlag.split(',') : []
  )

  const triggerAndNotifsInfo = (await Promise.all(
    cronKonnectorTriggers.map(async trigger => {
      return {
        trigger,
        shouldNotify: await shouldNotify({
          client,
          trigger,
          previousStates,
          serviceTrigger
        })
      }
    })
  )).filter(({ trigger, shouldNotify }) => {
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
  })

  const konnectorSlugs = uniq(
    triggerAndNotifsInfo.map(({ trigger }) => getKonnectorSlug(trigger))
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

  logger('info', `${triggerAndNotifsInfo.length} konnector triggers to notify`)

  if (triggerAndNotifsInfo.length) {
    const notifView = buildNotification(client, {
      konnectorAlerts: triggerAndNotifsInfo.map(({ trigger }) => {
        const konnectorSlug = trigger.message.konnector
        return {
          konnectorSlug,
          konnectorName: konnectorNamesBySlug[konnectorSlug] || konnectorSlug,
          trigger
        }
      })
    })
    await sendNotification(client, notifView)
  }

  await storeTriggerStates(client, cronKonnectorTriggers, triggerStatesDoc)
}

export const destroyObsoleteTrigger = async (client, trigger) => {
  if (trigger?.type === '@at') {
    logger('info', 'Try to destroy @at trigger...')

    const isObsolete = +new Date(trigger?.arguments) < +new Date()

    if (isObsolete) {
      await client.destroy(trigger)
      logger('info', `Destroyed @at trigger with id ${trigger._id}`)
    } else {
      logger(
        'info',
        `Nothing happened, trigger with id ${trigger._id} is not yet obsolete`
      )
    }
  }
}

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

  const triggerId = process.env.COZY_TRIGGER_ID
  const jobId = process.env.COZY_JOB_ID.split('/').pop()

  logger(
    'info',
    `Executing job notifications service by trigger: ${triggerId}, job: ${jobId}...`
  )

  const serviceTrigger = triggerId
    ? (await client.query(Q(TRIGGER_DOCTYPE).getById(triggerId))).data
    : undefined

  const serviceJob = jobId
    ? (await client.query(Q(JOBS_DOCTYPE).getById(jobId))).data
    : undefined

  // Used to execute a script on maif instance
  // that force the execution of this service
  // TODO should be removed after executing the script
  if (serviceJob?.message?.forceIgnoredErrors) {
    flag(
      'banks.konnector-alerts.ignored-errors',
      serviceJob.message.forceIgnoredErrors
    )
    logger(
      'info',
      `Forced flag banks.konnector-alerts.ignored-errors to: ${serviceJob.message.forceIgnoredErrors}`
    )
  }

  await sendTriggerNotifications(client, serviceTrigger)
  await destroyObsoleteTrigger(client, serviceTrigger)
}

if (require.main === module || process.env.NODE_ENV === 'production') {
  runService(main)
}

export default main
