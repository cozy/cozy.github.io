import { useMemo } from 'react'
import { useClient } from 'cozy-client'
import { useSelector } from 'react-redux'
import { getDocumentFromState } from 'cozy-client/dist/store'

const useDocument = (doctype, id) => {
  const client = useClient()
  const doc = useSelector(state => getDocumentFromState(state, doctype, id))
  const hydrated = useMemo(() => client.hydrateDocument(doc), [client, doc])
  return hydrated
}

export default useDocument
