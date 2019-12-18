import keyBy from 'lodash/keyBy'
import omit from 'lodash/omit'

export const importData = async (client, achData) => {
  for (const [doctype, documents] of Object.entries(achData)) {
    const col = client.collection(doctype)
    const existingIds = documents.map(getDocumentID).filter(Boolean)
    const existingDocsResp = await col.getAll(existingIds)
    const existingDocs = keyBy(
      existingDocsResp.data.map(x => omit(x, '_type')),
      getDocumentID
    )
    const updatedDocs = documents.map(x => {
      const existing = existingDocs[x._id]
      const updatedDoc = { ...existing, ...x }
      return updatedDoc
    })
    const responses = await col.updateAll(updatedDocs)
    const errors = responses.filter(resp => resp.error)
    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Errors while importing data', errors)
    }
  }
}

export const getDocumentID = x => x._id
