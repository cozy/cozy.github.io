const log = require('./log')

const flagForDeletion = doc => ({ ...doc, _deleted: true })
const dropCollection = (client, doctype) => {
  return client.stackClient
    .fetchJSON('GET', `/data/${doctype}/_all_docs?include_docs=true`)
    .then(result => result.rows.map(r => r.doc))
    .then(docs =>
      client.stackClient.fetchJSON('POST', `/data/${doctype}/_bulk_docs`, {
        docs: docs.map(flagForDeletion)
      })
    )
    .then(results => {
      log.success(
        doctype +
          ': deleted ' +
          results.filter(result => result.ok).length +
          '/' +
          results.length +
          ' documents.'
      )
      return results
    })
}

// drop all documents of the given doctype
module.exports = (client, doctypes) => {
  const promises = doctypes.map(doctype => dropCollection(client, doctype))
  return Promise.all(promises)
}
