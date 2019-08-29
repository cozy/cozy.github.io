const flagForDeletion = doc => {
  return { _id: doc._id, _rev: doc._rev, _deleted: true }
}

export const deleteAll = async (cozyClient, doctype, docs) => {
  return cozyClient.stackClient.fetchJSON(
    'POST',
    `/data/${doctype}/_bulk_docs`,
    {
      docs: docs.map(flagForDeletion)
    }
  )
}
