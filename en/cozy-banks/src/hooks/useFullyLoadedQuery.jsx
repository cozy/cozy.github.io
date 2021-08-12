import { useEffect } from 'react'
import { useQuery } from 'cozy-client'
import useSafeState from './useSafeState'

/**
 * Will run fetchMore on the query until the query is fully loaded
 */
const useFullyLoadedQuery = (query, options) => {
  const res = useQuery(query, options)
  const [fetching, setFetching] = useSafeState(false)
  useEffect(() => {
    const checkToFetchMore = async () => {
      if (res.fetchStatus === 'loaded' && res.hasMore && !fetching) {
        setFetching(true)
        await res.fetchMore()
        setFetching(false)
      }
    }
    checkToFetchMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.hasMore, res.fetchStatus, fetching])
  return res
}

export default useFullyLoadedQuery
