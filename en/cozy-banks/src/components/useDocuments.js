import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useClient } from 'cozy-client'
import { getDocumentFromState } from 'cozy-client/dist/store'

const useDocuments = (doctype, ids) => {
  const client = useClient()
  const docs = useSelector(state =>
    ids.map(id => getDocumentFromState(state, doctype, id))
  )
  const hydrated = useMemo(
    () => client.hydrateDocuments(doctype, docs),
    [client, docs, doctype]
  )
  return hydrated
}

export default useDocuments
