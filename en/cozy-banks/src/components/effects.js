import { useEffect, useState } from 'react'
import { Intents } from 'cozy-interapp'

export const useRedirectionURL = (client, doctype, options) => {
  const [redirectionURL, setRedirectionURL] = useState(null)
  useEffect(() => {
    const fetch = async () => {
      const intents = new Intents({ client: client })
      const redirectionURL = await intents.getRedirectionURL(doctype, options)
      setRedirectionURL(redirectionURL)
    }
    fetch()
  }, [client.uri, doctype, options])
  return redirectionURL
}
