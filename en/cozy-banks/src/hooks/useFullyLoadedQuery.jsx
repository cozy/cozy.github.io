import { useEffect } from 'react'
import { useQuery } from 'cozy-client'
/**
 * Will run fetchMore on the query until the query is fully loaded
 */
const useFullyLoadedQuery = (query, options) => {
  const res = useQuery(query, options)
  useEffect(() => {
    if (res.fetchStatus === 'loaded' && res.hasMore) {
      res.fetchMore()
    }
  }, [res.fetchStatus, res.fetchMore, res])
  return res
}

export default useFullyLoadedQuery
