import { useState, useCallback, useEffect } from 'react'
import { useClient } from 'cozy-client'
import pickBy from 'lodash/pickBy'

/**
 * Custom hook to get a URL to another app / konnector
 */
const useRedirectionURL = (doctype, { type, category, pendingUpdate }) => {
  const client = useClient()
  const [redirectionURL, setRedirectionURL] = useState()
  const updateRedirectionURL = useCallback(async () => {
    try {
      const url = await client.intents.getRedirectionURL(
        'io.cozy.apps',
        pickBy({ type, category, pendingUpdate }, Boolean)
      )
      setRedirectionURL(url)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        `useRedirectionURL: Could not get redirection url for type: ${type}, category: ${category}.`
      )
    }
  }, [client.intents, type, category, pendingUpdate])

  useEffect(() => {
    updateRedirectionURL()
  }, [updateRedirectionURL])

  return [redirectionURL, updateRedirectionURL]
}

export default useRedirectionURL
