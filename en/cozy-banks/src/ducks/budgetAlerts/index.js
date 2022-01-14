import logger from 'cozy-logger'
import { TRANSACTION_DOCTYPE, ACCOUNT_DOCTYPE, GROUP_DOCTYPE } from 'doctypes'
import { getCategoryId } from 'ducks/transactions/helpers'
import { isParentOf } from 'ducks/categories/categoriesMap'
import sumBy from 'lodash/sumBy'
import { fetchCategoryAlerts } from 'ducks/settings/helpers'
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns'

import { Q } from 'cozy-client'

const log = logger.namespace('category-alerts')

const copyAlert = alert => ({ ...alert })

const fetchGroup = async (client, groupId) => {
  const { data: group } = await client.query(Q(GROUP_DOCTYPE).getById(groupId))
  return group
}

export const makeNewAlert = () => ({
  // Default category is Daily Life > Supermarket
  categoryId: '400110',
  maxThreshold: 100,
  accountOrGroup: null
})

const makeSelectorForAccountOrGroup = async (client, accountOrGroup) => {
  if (!accountOrGroup) {
    return null
  } else if (accountOrGroup._type === GROUP_DOCTYPE) {
    // TODO find the right way to make an $or selector that works with cozyClient.query
    // With an $or we have an error "no matching index found, create an index"
    // Seems like a $in selector would be better, see ducks/transactions/queries.js
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

const categoryMatches = (categoryId, idToMatch, allowChildren) => {
  return allowChildren
    ? isParentOf(idToMatch, categoryId)
    : idToMatch === categoryId
}

export const fetchExpensesForAlert = async (
  client,
  alert,
  originalCurrentDate
) => {
  let currentDate = originalCurrentDate
    ? new Date(originalCurrentDate)
    : new Date()
  const start = format(startOfMonth(currentDate), 'YYYY-MM')
  const end = format(addDays(endOfMonth(currentDate), 1), 'YYYY-MM')
  const selector = {
    date: {
      $lt: end,
      $gt: start
    },
    amount: {
      $lt: 0
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
  log(
    'info',
    `Selecting transactions with ${JSON.stringify(selector)} (alertId: ${
      alert.id
    })`
  )
  const { data: monthExpenses } = await client.query(
    Q(TRANSACTION_DOCTYPE).where(selector)
  )

  const categoryExpenses = monthExpenses.filter(tr =>
    categoryMatches(getCategoryId(tr), alert.categoryId, alert.categoryIsParent)
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
 * @return {AlertInfo}  - { updatedAlert, expenses }
 */
export const collectAlertInfo = async (client, alert, options) => {
  const expenses = await fetchExpensesForAlert(
    client,
    alert,
    options.currentDate
  )

  log(
    'info',
    `Found ${expenses.length} expenses for alert ${alert.id} (currentDate: ${options.currentDate})`
  )

  const sum = Math.round(-sumBy(expenses, tr => tr.amount), 2)

  if (sum < alert.maxThreshold) {
    log(
      'info',
      `Threshold (${alert.maxThreshold}) has not been passed, bailing out (alertId: ${alert.id})`
    )
    return
  }

  if (
    alert.lastNotificationAmount !== undefined &&
    alert.lastNotificationAmount === sum &&
    !options.force
  ) {
    log('info', `Same amount as last notification, bailing out`)
    return
  }

  const updatedAlert = copyAlert(alert)
  updatedAlert.lastNotificationAmount = sum
  updatedAlert.lastNotificationDate = new Date().toISOString().slice(0, 10)
  return {
    alert: updatedAlert,
    expenses: expenses
  }
}

export { fetchCategoryAlerts }
