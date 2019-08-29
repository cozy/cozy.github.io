export const isCollectionLoading = col => {
  if (!col) {
    console.warn('isCollectionLoading called on falsy value.') // eslint-disable-line no-console
    return false
  }
  return col.fetchStatus === 'loading' || col.fetchStatus === 'pending'
}

export const hasBeenLoaded = col => {
  return col.lastFetch
}

export const associateDocuments = (
  originalDocument,
  associationName,
  associationDoctype,
  documentsToAssociate
) => {
  const ids = documentsToAssociate.map(doc => doc.id)

  originalDocument[associationName] = {
    data: documentsToAssociate,
    doctype: associationDoctype,
    name: associationName,
    raw: ids,
    target: {
      ...originalDocument,
      [associationName]: ids
    }
  }

  return originalDocument
}
