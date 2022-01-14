import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isQueryLoading, useQuery } from 'cozy-client'

import sumBy from 'lodash/sumBy'

import { getFilteredAccounts } from 'ducks/filters'

import { recurrenceConn, accountsConn } from 'doctypes'
import { getPlannedTransactions } from './selectors'

/** Returns estimatedBalance and number of planned transactions for currently filtered accounts */
const useEstimatedBudget = () => {
  const recurrenceCol = useQuery(recurrenceConn.query, recurrenceConn)
  // Do not use the result of this query but make sure accounts are loaded since
  // we use a selector on them afterwards
  const accountsCol = useQuery(accountsConn.query, accountsConn)
  const transactions = useSelector(getPlannedTransactions)
  const accounts = useSelector(getFilteredAccounts)
  const sumTransactions = useMemo(
    () => sumBy(transactions, x => x.amount),
    [transactions]
  )
  const sumAccounts = useMemo(() => sumBy(accounts, x => x.balance), [accounts])
  const isLoading = isQueryLoading(recurrenceCol) || isQueryLoading(accountsCol)
  return {
    isLoading: isLoading,
    estimatedBalance: isLoading ? null : sumAccounts + sumTransactions,
    sumTransactions,
    currency: accounts && accounts.length ? accounts[0].currency : null,
    transactions
  }
}

export default useEstimatedBudget
