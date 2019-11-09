import logger from 'cozy-logger'
import isEqual from 'lodash/isEqual'
import { TRANSACTION_DOCTYPE, ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { getCategoryId } from 'ducks/categories/helpers'
import sumBy from 'lodash/sumBy'
import {
  fetchCategoryAlerts,
  updateCategoryAlerts
} from 'ducks/settings/helpers'
import CategoryBudgetNotificationView from './CategoryBudgetNotificationView'
import { sendNotification } from 'cozy-notifications'
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns'

const lang = process.env.COZY_LOCALE || 'en'
const dictRequire = lang => require(`../../locales/${lang}`)

const log = logger.namespace('category-alerts')

const copyAlert = alert => ({ ...alert })

const fetchGroup = async (client, groupId) => {
  const { data: group } = await client.query(
    client.all(GROUP_DOCTYPE).getById(groupId)
  )
  return group
}

const makeSelectorForAccountOrGroup = async (client, accountOrGroup) => {
  if (!accountOrGroup) {
    return null
  } else if (accountOrGroup._type === GROUP_DOCTYPE) {
    // TODO find the right way to make an $or selector that works with cozyClient.query
    // With an $or we have an error "no matching index found, create an index"
    return null
  } else if (accountOrGroup._type === ACCOUNT_DOCTYPE) {
    return {
      account: accountOrGroup._id
    }
  } else {
    throw new Error(
      `Unsupported _type (${accountOrGroup._type}) for alert.accountOrGroup`
    )
  }
}

export const fetchExpensesForAlert = async (client, alert, currentDate) => {
  currentDate = currentDate ? new Date(currentDate) : new Date()
  const start = format(startOfMonth(currentDate), 'YYYY-MM')
  const end = format(addDays(endOfMonth(currentDate), 1), 'YYYY-MM')
  const selector = {
    date: {
      $lt: end,
      $gt: start
    },
    amount: {
      $gt: 0
    }
  }
  if (alert.accountOrGroup) {
    const accountOrGroupSelector = await makeSelectorForAccountOrGroup(
      client,
      alert.accountOrGroup
    )
    if (accountOrGroupSelector) {
      Object.assign(selector, accountOrGroupSelector)
    }
  }
  const { data: monthExpenses } = await client.query(
    client.all(TRANSACTION_DOCTYPE).where(selector)
  )
  const categoryExpenses = monthExpenses.filter(
    tr => getCategoryId(tr) === alert.categoryId
  )

  let groupFilter
  if (alert.accountOrGroup && alert.accountOrGroup._type === GROUP_DOCTYPE) {
    const group = await fetchGroup(client, alert.accountOrGroup._id)
    groupFilter = tr => group.accounts.includes(tr.account)
  }

  return groupFilter ? categoryExpenses.filter(groupFilter) : categoryExpenses
}

/**
 * Fetches transactions of current month corresponding to the alert
 * Computes sum and returns information used to send the global
 * alert email
 *
 * Bails out if
 *
 * - sum is inferior to alert amount
 * - the last reported amount inside alert is the same as the computed amount
 *
 * @param {Boolean} options.force Bypass last report checks
 *
 * @return {CategoryBudgetAlert}  - Updated alert (lastNotificationDate, lastNotificationAmount)
 */
const collectAlertInfo = async (client, alert, options) => {
  const expenses = await fetchExpensesForAlert(
    client,
    alert,
    options.currentDate
  )

  const sum = sumBy(expenses, tr => tr.amount)

  if (sum < alert.maxThreshold) {
    log(
      'info',
      `Threshold (${alert.maxThreshold}) has not been passed, bailing out`
    )
    return
  }

  if (
    alert.lastNotificationAmount !== undefined &&
    alert.lastNotificationAmount === sum &&
    !options.force
  ) {
    log('info', `Same amount as last notification, bailing out`)
  }

  const updatedAlert = copyAlert(alert)
  updatedAlert.lastNotificationAmount = sum
  updatedAlert.lastNotificationDate = new Date().toISOString().slice(0, 10)
  return {
    alert: updatedAlert,
    expenses: expenses
  }
}

/**
 * Collects notification data for all alerts
 *
 * Return nulls if nothing is to be sent
 */
const buildNotificationData = async (client, alerts, options = {}) => {
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

const buildNotificationView = client => {
  const notifView = new CategoryBudgetNotificationView({
    client,
    lang,
    data: {},
    locales: {
      [lang]: dictRequire(lang)
    }
  })
  return notifView
}

/**
 * Sends category budget notification and updates settings if successful
 */
const runCategoryBudgetService = async (client, options) => {
  log('info', 'Running category budget notification service')
  const alerts = await fetchCategoryAlerts(client)
  log('info', `Found ${alerts.length} alert(s)`)
  const data = await buildNotificationData(client, alerts, {
    force: options.force,
    currentDate: options.currentDate
  })
  if (!data) {
    log('info', 'Nothing to send, bailing out')
    return
  }
  const notifView = buildNotificationView(client)
  await sendNotification(client, notifView)
  log('info', `Saving updated alerts`)
  const updatedAlerts = data.map(x => x.alert)
  log('info', 'Saving updated category alerts')
  await updateCategoryAlerts(client, updatedAlerts)
}

export {
  buildNotificationData,
  buildNotificationView,
  fetchCategoryAlerts,
  runCategoryBudgetService
}
