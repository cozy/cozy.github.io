import isEqual from 'lodash/isEqual'
import logger from 'cozy-logger'

import { collectAlertInfo } from 'ducks/budgetAlerts'
import CategoryBudgetNotificationView from 'ducks/notifications/CategoryBudget'

const lang = process.env.COZY_LOCALE || 'en'
const dictRequire = lang => require(`locales/${lang}`)

const log = logger.namespace('category-alerts')

/**
 * Collects notification data for all alerts
 *
 * Return nulls if nothing is to be sent
 */
export const buildNotificationData = async (client, alerts, options = {}) => {
  if (alerts.length === 0) {
    log('info', 'No category budget alerts, bailing out.')
  }

  const data = []
  for (let alert of alerts) {
    const info = { alert }
    try {
      const collectedInfo = await collectAlertInfo(client, alert, options)
      if (collectedInfo) {
        Object.assign(info, collectedInfo)
      }
    } catch (e) {
      log(
        'error',
        `Error while checking budget alert ${alert.id} (message: ${e.message})`
      )
    }
    data.push(info)
  }

  const updatedAlerts = data.map(x => x.alert)
  if (isEqual(alerts, updatedAlerts) && !options.force) {
    log('info', 'No change to alerts, no need to send')
    return null
  }

  return data
}

export const buildNotificationView = (client, options) => {
  const notifView = new CategoryBudgetNotificationView({
    client,
    lang,
    data: {},
    locales: {
      [lang]: dictRequire(lang)
    },
    ...options
  })
  return notifView
}

export const hasBudgetAlerts = templateData => {
  const { budgetAlerts } = templateData
  const hasMultipleAlerts = budgetAlerts.length > 1
  return hasMultipleAlerts
}
