import {
  getBalanceHistories,
  sumBalanceHistories,
  balanceHistoryToChartData
} from 'ducks/balance/helpers'
import { getCategoryId } from 'ducks/categories/helpers'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'

const getBalanceHistory = (accounts, transactions, to, from) => {
  const balanceHistories = getBalanceHistories(accounts, transactions, to, from)
  const balanceHistory = sumBalanceHistories(Object.values(balanceHistories))

  return balanceHistory
}

export const getChartData = (
  accountsCol,
  transactionsCol,
  filteredTransactions,
  filteredAccounts,
  to,
  from
) => {
  const isLoading =
    (isCollectionLoading(transactionsCol) && !hasBeenLoaded(transactionsCol)) ||
    (isCollectionLoading(accountsCol) && !hasBeenLoaded(accountsCol))

  if (isLoading) {
    return null
  }

  const history = getBalanceHistory(
    filteredAccounts,
    filteredTransactions,
    to,
    from
  )
  const data = balanceHistoryToChartData(history)
  return data
}

export const getChartTransactions = (filteredTransactions, categoryId) => {
  if (!categoryId) {
    return filteredTransactions
  }

  // TODO should be done via selectors
  return filteredTransactions.filter(
    transaction => getCategoryId(transaction) === categoryId
  )
}
