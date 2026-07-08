import { useEffect, useState } from 'react'

import { useQuery } from 'cozy-client'

export const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 500

// NOTE: this is a stopgap. Automatically retrying transient fetch failures
// (e.g. "Failed to fetch" / NetworkError when the stack momentarily cannot be
// reached) should be a first-class cozy-client capability, a retry option on
// useQuery or a dedicated RetryLink, rather than being re-implemented in every
// app. See linagora/cozy-client#1694 (related: linagora/cozy-client#1031).
//
// Wraps useQuery and, when a query ends up in `failed` (a thrown fetch, not an
// HTTP error status), retries it a few times with exponential backoff before
// surfacing the failure. While retries remain the consumer sees `isRetrying`
// (keep showing a spinner) rather than `hasError`.
export const useQueryWithRetry = (definition, options) => {
  const queryResult = useQuery(definition, options)
  const { fetchStatus, fetch } = queryResult
  const [retryCount, setRetryCount] = useState(0)
  const [prevFetchStatus, setPrevFetchStatus] = useState(fetchStatus)

  // Reset the retry budget after a success. This is a derived-state adjustment
  // done during render (not in an effect), so a later transient failure gets
  // its own retries.
  if (fetchStatus !== prevFetchStatus) {
    setPrevFetchStatus(fetchStatus)
    if (fetchStatus === 'loaded' && retryCount !== 0) {
      setRetryCount(0)
    }
  }

  useEffect(() => {
    if (fetchStatus !== 'failed' || retryCount >= MAX_RETRIES) return

    const delay = RETRY_BASE_DELAY * 2 ** retryCount
    const timeoutId = setTimeout(() => {
      fetch()
      setRetryCount(count => count + 1)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [fetchStatus, retryCount, fetch])

  return {
    ...queryResult,
    isRetrying: fetchStatus === 'failed' && retryCount < MAX_RETRIES,
    hasError: fetchStatus === 'failed' && retryCount >= MAX_RETRIES
  }
}
