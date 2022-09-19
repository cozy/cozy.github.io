import { useContext, useCallback, useEffect } from 'react'
import { useClient } from 'cozy-client'
import pickBy from 'lodash/pickBy'
import { StoreURLContext } from 'ducks/store/StoreContext'
/**
 * Custom hook to get a URL to another app / konnector
 */
const useRedirectionURL = (
  doctype,
  { type, category, pendingUpdate },
  enabled = true
) => {
  const client = useClient()
  const { url, setUrl } = useContext(StoreURLContext)

  const updateRedirectionURL = useCallback(async () => {
    try {
      const urlFetched = await client.intents.getRedirectionURL(
        'io.cozy.apps',
        pickBy({ type, category, pendingUpdate }, Boolean)
      )
      setUrl(urlFetched)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(
        `useRedirectionURL: Could not get redirection url for type: ${type}, category: ${category}.`
      )
    }
  }, [client.intents, type, category, pendingUpdate])

  useEffect(() => {
    if (enabled) {
      if (!url) {
        updateRedirectionURL()
      }
    }
  }, [updateRedirectionURL, enabled])

  return [url, updateRedirectionURL]
}

export default useRedirectionURL
