import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { APPLICATION_DATE } from 'ducks/transactions/constants'
import useLast from 'hooks/useLast'
import useFullyLoadedQuery from 'hooks/useFullyLoadedQuery'
import { computeTransactionsByDateAndApplicationDate } from 'ducks/transactions/helpers'
import { computeCategoriesData } from 'ducks/categories/selectors'
import {
  makeFilteredTransactionsConn,
  addPeriodToConn
} from 'ducks/transactions/queries'
import { accountsConn, settingsConn, groupsConn } from 'doctypes'
import { getFilteringDoc, getPeriod } from 'ducks/filters'
import { useParams } from 'components/RouterContext'
import { useClient, isQueryLoading, useQuery } from 'cozy-client'

const autoUpdateOptions = {
  add: false,
  remove: true,
  update: true
}
const setAutoUpdate = conn => ({ ...conn, autoUpdate: autoUpdateOptions })
// eslint-disable-next-line
const enhanceCategoriesPage = Component => props => {
  const client = useClient()
  const params = useParams()
  const accounts = useQuery(accountsConn.query, accountsConn)
  const groups = useQuery(groupsConn.query, groupsConn)
  const settings = useQuery(settingsConn.query, settingsConn)

  const filteringDoc = useSelector(getFilteringDoc)
  const period = useSelector(getPeriod)
  const dispatch = useDispatch()

  const initialConnByDate = makeFilteredTransactionsConn({
    groups,
    accounts,
    filteringDoc,
    dateAttribute: 'date'
  })
  const initialConnByApplicationDate = makeFilteredTransactionsConn({
    groups,
    accounts,
    filteringDoc,
    dateAttribute: APPLICATION_DATE
  })

  const connByDate = useMemo(() => {
    return period
      ? setAutoUpdate(
          addPeriodToConn({
            baseConn: initialConnByDate,
            period,
            dateAttribute: 'date'
          })
        )
      : setAutoUpdate(initialConnByDate)
  }, [initialConnByDate, period])

  const connByApplicationDate = useMemo(() => {
    return period
      ? setAutoUpdate(
          addPeriodToConn({
            baseConn: initialConnByApplicationDate,
            period,
            dateAttribute: APPLICATION_DATE
          })
        )
      : setAutoUpdate(initialConnByApplicationDate)
  }, [initialConnByApplicationDate, period])

  const transactionsByDate = useFullyLoadedQuery(connByDate.query, connByDate)
  const transactionsByApplicationDate = useFullyLoadedQuery(
    connByApplicationDate.query,
    connByApplicationDate
  )

  // This is used for loaded transactions to stay rendered while
  // next/previous month transactions are loaded
  const colByDate = useLast(transactionsByDate, (last, cur) => {
    return !last || (cur.lastUpdate && !cur.hasMore)
  })
  const colByApplicationDate = useLast(
    transactionsByApplicationDate,
    (last, cur) => {
      return !last || (cur.lastUpdate && !cur.hasMore)
    }
  )

  const transactionsData = useMemo(
    () =>
      computeTransactionsByDateAndApplicationDate({
        transactionsByDate: transactionsByDate.data,
        transactionsByApplicationDate: transactionsByApplicationDate.data
      }),
    [transactionsByApplicationDate.data, transactionsByDate.data]
  )

  const categories = useMemo(() => {
    return computeCategoriesData(transactionsData || [])
  }, [transactionsData])

  return (
    <Component
      {...props}
      accounts={accounts}
      groups={groups}
      settings={settings}
      categories={categories}
      transactions={colByDate}
      transactionsByApplicationDate={colByApplicationDate}
      filteringDoc={filteringDoc}
      period={period}
      client={client}
      params={params}
      filteredTransactionsByAccount={transactionsData}
      dispatch={dispatch}
      isFetching={
        isQueryLoading(transactionsByDate) ||
        transactionsByDate.hasMore ||
        isQueryLoading(transactionsByApplicationDate) ||
        transactionsByApplicationDate.hasMore
      }
    />
  )
}

export default enhanceCategoriesPage
