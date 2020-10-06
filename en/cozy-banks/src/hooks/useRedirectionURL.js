import { useState, useCallback, useEffect } from 'react'
import { useClient } from 'cozy-client'
import pickBy from 'lodash/pickBy'

/**
 * Custom hook to get a URL to another app / konnector
 */
const useRedirectionURL = (doctype, { type, category }) => {
  const client = useClient()
  const [redirectionURL, setRedirectionURL] = useState()
  const updateRedirectionURL = useCallback(async () => {
    const url = await client.intents.getRedirectionURL(
      'io.cozy.apps',
      pickBy({ type, category }, Boolean)
    )
    setRedirectionURL(url)
  }, [client, type, category, setRedirectionURL])

  useEffect(() => {
    updateRedirectionURL()
  }, [updateRedirectionURL])

  return [redirectionURL, updateRedirectionURL]
}

export default useRedirectionURL
