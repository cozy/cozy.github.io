import { useEffect, useRef } from 'react'

import log from 'cozy-logger'

import { useQueryWithRetry } from '@/hooks/useQueryWithRetry'
import {
  makeAccountsQuery,
  makeAppsQuery,
  makeKonnectorsQuery,
  makeTriggersQuery
} from '@/queries'

export const useFetchInitialData = () => {
  const accountsQuery = useQueryWithRetry(
    makeAccountsQuery.definition,
    makeAccountsQuery.options
  )
  const konnectorsQuery = useQueryWithRetry(
    makeKonnectorsQuery.definition,
    makeKonnectorsQuery.options
  )
  const appsQuery = useQueryWithRetry(
    makeAppsQuery.definition,
    makeAppsQuery.options
  )
  const triggersQuery = useQueryWithRetry(
    makeTriggersQuery.definition,
    makeTriggersQuery.options
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allQueries = [accountsQuery, konnectorsQuery, appsQuery, triggersQuery]

  const startTime = useRef(null)
  const loggedTime = useRef(false)

  useEffect(() => {
    if (startTime.current === null) {
      startTime.current = performance.now()
    }

    const allFetched = allQueries.every(query => query.fetchStatus === 'loaded')

    if (allFetched && !loggedTime.current) {
      const endTime = performance.now()
      log('info', `Required data fetched in ${endTime - startTime.current} ms`)
      loggedTime.current = true
    }
  }, [allQueries])

  const isFetching = allQueries.some(
    query =>
      query.fetchStatus === 'loading' ||
      query.fetchStatus === 'pending' ||
      query.isRetrying
  )
  // A query is only considered in error once useQueryWithRetry has exhausted its
  // retries: a transient network failure keeps the app in the loading state
  // instead of flashing the initial-data error screen.
  const hasError = allQueries.some(query => query.hasError)

  return {
    isFetching,
    hasError,
    data: {
      accounts: accountsQuery.data,
      konnectors: konnectorsQuery.data,
      apps: appsQuery.data,
      triggers: triggersQuery.data
    }
  }
}
