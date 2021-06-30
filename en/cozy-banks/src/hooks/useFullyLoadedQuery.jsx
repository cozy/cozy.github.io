import { useEffect, useState, useRef } from 'react'
import { useQuery } from 'cozy-client'

const useIsMounted = () => {
  const mounted = useRef()
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return mounted
}

/**
 * Will run fetchMore on the query until the query is fully loaded
 */
const useFullyLoadedQuery = (query, options) => {
  const res = useQuery(query, options)
  const [fetching, setFetching] = useState(false)
  const mounted = useIsMounted()
  useEffect(() => {
    const checkToFetchMore = async () => {
      if (res.fetchStatus === 'loaded' && res.hasMore && !fetching) {
        setFetching(true)
        await res.fetchMore()
        if (mounted.current) {
          setFetching(false)
        }
      }
    }
    checkToFetchMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.hasMore, res.fetchStatus, fetching])
  return res
}

export default useFullyLoadedQuery
