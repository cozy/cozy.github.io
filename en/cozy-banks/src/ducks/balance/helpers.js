import get from 'lodash/get'
import uniq from 'lodash/uniq'
import sumBy from 'lodash/sumBy'
import groupBy from 'lodash/groupBy'
import flatten from 'lodash/flatten'
import {
  min as getEarliestDate,
  isAfter as isDateAfter,
  isEqual as isDateEqual,
  subDays,
  parse as parseDate,
  format as formatDate,
  isValid as isDateValid
} from 'date-fns'
import { getAccountBalance } from 'ducks/account/helpers'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'

/**
 * Get balance history for an account
 * @param {Object} account - The account we want to get the balance history
 * @param {Object[]} transactions - The transactions of the account
 * @param {Date} to - The date to which you want the history
 * @param {Date} from - The date from you want the history
 * @returns {Object} The balance history indexed by dates (YYYY-MM-DD)
 */
export const getBalanceHistory = (account, transactions, to, from) => {
  let clonedFrom = from
  const DATE_FORMAT = 'YYYY-MM-DD'

  const transactionsByDate = groupBy(transactions, t =>
    formatDate(
      // do not take .realisationDate as we are interested in the debit date
      t.date,
      DATE_FORMAT
    )
  )

  if (!clonedFrom) {
    const earliestTransactionDate = getEarliestDate(
      ...Object.keys(transactionsByDate)
    )
    clonedFrom = isDateValid(earliestTransactionDate)
      ? earliestTransactionDate
      : to
  }

  const balances = {}

  for (
    let day = to, balance = getAccountBalance(account);
    isDateAfter(day, clonedFrom) || isDateEqual(day, clonedFrom);
    day = subDays(day, 1)
  ) {
    const date = formatDate(day, DATE_FORMAT)
    const transactions = transactionsByDate[date]
    balance = transactions
      ? balance - sumBy(transactions, t => t.amount)
      : balance

    balances[date] = balance
  }

  return balances
}

/**
 * Get transactions that match an account id in a set of transactions.
 * The transactions can have their relationship to accounts resolved or not, both cases are handled
 * @param {number} accountId - The ID of the account
 * @param {Object[]} transactions - The transactions to filter
 * @returns {Object[]}
 */
export const filterTransactionsByAccount = (accountId, transactions) => {
  return transactions.filter(t => {
    const toCompare = t.account.data ? t.account.data._id : t.account

    return accountId === toCompare
  })
}

/**
 * Get balance histories for a set of accounts
 * @param {Object[]} accounts - The accounts we want to get the balance histories
 * @param {Object[]} transactions - The transactions
 * @param {Date} to - The date to which you want the history
 * @param {Date} from - The date from which you want the history
 * @returns {Object} The balance histories indexed by the account ID
 */
export const getBalanceHistories = (accounts, transactions, to, from) => {
  if (accounts.length === 0) {
    return {
      __no_accounts__: getBalanceHistory(
        { _id: '__no_accounts__', balance: 0 },
        [],
        to,
        from
      )
    }
  }

  const balances = accounts.reduce((balances, account) => {
    balances[account._id] = getBalanceHistory(
      account,
      filterTransactionsByAccount(account._id, transactions),
      to,
      from
    )

    return balances
  }, {})

  return balances
}

/**
 * Returns all the unique dates for a given array of balance histories
 * @param {Object[]} histories - The array of balance histories
 * @returns {String[]} The dates
 */
export const getAllDates = histories => {
  return uniq(flatten(histories.map(Object.keys)))
}

/**
 * Sums a given array of balance histories on date
 * @param {Object[]} histories - The array of balance histories
 * @returns {Object} The summed balance history
 */
export const sumBalanceHistories = histories => {
  const allDates = getAllDates(histories)

  const history = {}

  for (const date of allDates) {
    history[date] = sumBy(histories, h => h[date])
  }

  return history
}

/**
 * Transforms a balance history to displayable chart data
 * @param {Object} history - The balance history to transform
 * @returns {Object[]}
 */
export const balanceHistoryToChartData = history => {
  const dates = getAllDates([history]).sort()

  const data = dates.map(date => ({
    x: parseDate(date),
    y: history[date]
  }))

  return data
}

export const getPanelsState = (groups, currentPanelsState) => {
  const switchesState = groups.reduce((acc, group) => {
    const groupChecked = get(
      currentPanelsState,
      `[${group._id}].checked`,
      !isReimbursementsVirtualGroup(group)
    )
    const groupExpanded = get(
      currentPanelsState,
      `[${group._id}].expanded`,
      true
    )

    acc[group._id] = {
      checked: groupChecked,
      expanded: groupExpanded,
      accounts: get(group, 'accounts.data', []).reduce((acc2, account) => {
        if (!account) {
          return acc2
        }

        acc2[account._id] = {
          checked: get(
            currentPanelsState,
            `[${group._id}].accounts[${account._id}].checked`,
            true
          ),
          disabled: !groupChecked
        }

        return acc2
      }, {})
    }

    return acc
  }, {})

  return switchesState
}

export const isVirtualAccount = a => a.virtual
