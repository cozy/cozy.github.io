import memoize from 'lodash/memoize'
import keyBy from 'lodash/keyBy'
import get from 'lodash/get'
import addDays from 'date-fns/add_days'
import addHours from 'date-fns/add_hours'
import addMinutes from 'date-fns/add_minutes'
import addSeconds from 'date-fns/add_seconds'
import parse from 'date-fns/parse'
import subDays from 'date-fns/sub_days'
import subHours from 'date-fns/sub_hours'
import subMinutes from 'date-fns/sub_minutes'
import subSeconds from 'date-fns/sub_seconds'

import { Q } from 'cozy-client'

import { SETTINGS_DOCTYPE, TRIGGER_DOCTYPE } from 'doctypes'
import { KonnectorAlertNotification } from 'ducks/konnectorAlerts'
import { dictRequire, lang } from '../service'

const TRIGGER_STATES_DOC_ID = 'trigger-states'

export const getKonnectorSlug = trigger => trigger.message.konnector

export const fetchRegistryInfo = memoize(
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

/** Fetch triggers states from a special doc in the settings */
export const fetchTriggerStates = async client => {
  try {
    const { data } = await client.query(
      Q(SETTINGS_DOCTYPE).getById(TRIGGER_STATES_DOC_ID)
    )
    return data
  } catch {
    return {}
  }
}

export const getTriggerStates = async client => {
  const settingTriggerStatesDoc = await fetchTriggerStates(client)
  return get(settingTriggerStatesDoc, 'triggerStates', {})
}

/** Stores triggers states in a special doc in the settings, with notif infos */
export const storeTriggerStates = async (
  client,
  triggersAndNotifsInfo,
  previousDoc
) => {
  const triggerStatesWithNotifsInfo = triggersAndNotifsInfo.map(
    ({ trigger, shouldNotify }) => {
      return {
        ...trigger.current_state,
        shouldNotify
      }
    }
  )

  const triggerStatesWithNotifsInfoById = keyBy(
    triggerStatesWithNotifsInfo,
    'trigger_id'
  )

  const doc = {
    _id: TRIGGER_STATES_DOC_ID,
    _type: SETTINGS_DOCTYPE,
    triggerStates: triggerStatesWithNotifsInfoById
  }

  if (previousDoc && previousDoc._rev) {
    doc._rev = previousDoc._rev
  }
  return await client.save(doc)
}

export const isErrorActionable = errorMessage => {
  return (
    errorMessage &&
    (errorMessage.startsWith('LOGIN_FAILED') ||
      errorMessage.startsWith('USER_ACTION_NEEDED'))
  )
}

export const fetchRelatedFuturAtTriggers = async (client, id) => {
  const { data } = await client.query(
    Q(TRIGGER_DOCTYPE).where({
      type: '@at',
      'message.konnectorTriggerId': id,
      arguments: { $gt: new Date(Date.now()).toISOString() }
    })
  )

  return data
}

export const add = (base, { days = 0, hours = 0, minutes = 0, seconds = 0 }) =>
  addDays(addHours(addMinutes(addSeconds(base, seconds), minutes), hours), days)

export const sub = (base, { days = 0, hours = 0, minutes = 0, seconds = 0 }) =>
  subDays(subHours(subMinutes(subSeconds(base, seconds), minutes), hours), days)

export const isOlderThan = (referenceDate, { days, hours, minutes, seconds }) =>
  parse(referenceDate) < sub(Date.now(), { days, hours, minutes, seconds })
