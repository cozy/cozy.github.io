import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import CozyClient from 'cozy-client'
import SelectDates, { monthRange } from 'components/SelectDates'
import last from 'lodash/last'
import uniq from 'lodash/uniq'
import {
  subMonths,
  format,
  parse,
  differenceInCalendarMonths,
  isAfter
} from 'date-fns'
import { useQuery, useClient } from 'cozy-client'
import { getDate } from 'ducks/transactions/helpers'
import { getFilteringDoc } from 'ducks/filters'
import { groupsConn, accountsConn } from 'doctypes'
import {
  makeFilteredTransactionsConn,
  makeEarliestLatestQueries
} from './queries'

const rangeMonth = (startDate, endDate) => {
  const options = []

  for (let i = 0; i < differenceInCalendarMonths(endDate, startDate) + 1; i++) {
    options.push(subMonths(endDate, i))
  }

  return options
}

const getYearMonth = transaction => getDate(transaction).slice(0, 7)

export const getOptions = transactions => {
  const availableMonths = uniq(transactions.map(getYearMonth)).sort()

  const mAvailableMonths = new Set(availableMonths)

  const start = parse(availableMonths[0], 'YYYY-MM')
  const lastMonth = parse(last(availableMonths), 'YYYY-MM')
  const today = new Date()
  const end = isAfter(lastMonth, today) ? lastMonth : today

  return rangeMonth(start, end).map(month => {
    const fmted = format(month, 'YYYY-MM')
    return {
      yearMonth: fmted,
      disabled: !mAvailableMonths.has(fmted)
    }
  })
}

const useConn = conn => {
  return useQuery(conn.query, conn)
}

// We do not want queries with the minimal and maximal transaction to receive
// transactions from other queries
const extentAutoUpdateOptions = { update: true, add: false, remove: false }

const useTransactionExtent = () => {
  const client = useClient()
  const accounts = useConn(accountsConn)
  const groups = useConn(groupsConn)
  const filteringDoc = useSelector(getFilteringDoc)
  const transactionsConn = makeFilteredTransactionsConn({
    filteringDoc,
    accounts,
    groups
  })
  const [data, setData] = useState([])

  useEffect(() => {
    const fetch = async () => {
      const baseQuery = transactionsConn.query()
      const [earliestQuery, latestQuery] = makeEarliestLatestQueries(baseQuery)

      const [earliest, latest] = await Promise.all(
        [earliestQuery, latestQuery].map(async (q, i) => {
          const queryName = `${transactionsConn.as}-${
            i === 0 ? 'earliest' : 'latest'
          }`
          await client.query(q, {
            fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
            as: queryName,
            autoUpdate: extentAutoUpdateOptions
          })
          return client.getQueryFromState(queryName)
        })
      )
      setData([earliest.data[0], latest.data[0]])
    }

    if (transactionsConn.enabled) {
      fetch()
    }
  }, [transactionsConn.enabled, transactionsConn.as]) // eslint-disable-line

  return data
}

const TransactionSelectDates = props => {
  const [earliestTransaction, latestTransaction] = useTransactionExtent()
  const options = useMemo(() => {
    if (!earliestTransaction || !latestTransaction) {
      return []
    }
    const { date: earliestDate } = earliestTransaction
    const { date: latestDate } = latestTransaction
    return monthRange(new Date(earliestDate), new Date(latestDate))
      .map(date => ({
        yearMonth: format(date, 'YYYY-MM'),
        disabled: false
      }))
      .reverse()
  }, [earliestTransaction, latestTransaction])
  return (
    <>
      <SelectDates options={options} {...props} />
    </>
  )
}

export default React.memo(TransactionSelectDates)
