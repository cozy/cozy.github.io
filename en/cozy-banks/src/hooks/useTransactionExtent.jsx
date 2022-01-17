import { useState, useEffect } from 'react'

import { useSelector } from 'react-redux'
import CozyClient, { useClient, useQuery } from 'cozy-client'
import { groupsConn, accountsConn } from 'doctypes'
import {
  makeFilteredTransactionsConn,
  makeEarliestLatestQueries
} from 'ducks/transactions/queries'
import useSafeState from 'hooks/useSafeState'
import { getFilteringDoc } from 'ducks/filters'

// We do not want queries with the minimal and maximal transaction to receive
// transactions from other queries
const extentAutoUpdateOptions = { update: true, add: false, remove: false }

const useConn = conn => {
  return useQuery(conn.query, conn)
}

/**
 * Fetches earliest an latest transactions according to current
 * account/group filter
 *
 * @returns {[Transaction, Transaction, boolean]} = [earliestTransaction, latestTransaction, isLoading]
 */
const useTransactionExtent = () => {
  const client = useClient()
  const accounts = useConn(accountsConn)
  const groups = useConn(groupsConn)
  const [loading, setLoading] = useSafeState(true)
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
      setLoading(true)
      try {
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
      } catch (e) {
        // TODO Find something to do here...
      } finally {
        setLoading(false)
      }
    }

    if (transactionsConn.enabled) {
      fetch()
    }
  }, [transactionsConn.enabled, transactionsConn.as]) // eslint-disable-line

  return [data[0], data[1], loading]
}

export default useTransactionExtent
