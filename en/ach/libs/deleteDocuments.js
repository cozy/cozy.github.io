const deleteDocument = (client, doctype, id) => {
  return client.data
    .find(doctype, id)
    .then(doc => {
      // well now we drop them all...
      return client.data.delete(doctype, doc)
    })
    .then(doc => {
      console.log(`Deleted ${doc.id}`)
      return doc
    })
    .catch(err => {
      console.warn(err)
    })
}

// drop documents of the given doctype, ids
module.exports = (client, doctype, ids) => {
  const promises = ids.map(id => deleteDocument(client, doctype, id))
  return Promise.all(promises)
}
