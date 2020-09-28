const _ = require('lodash')
const fs = require('fs').promises
const log = require('./log')

// helpers
const stripMeta = function(obj) {
  const omitted = []
  if (process.env.ACH_NO_KEEP_ID) {
    omitted.push('_id')
  }
  if (!process.env.ACH_KEEP_REV) {
    omitted.push('_rev')
  }
  return _.omit(obj, omitted)
}

const fetchAll = async (cozyClient, doctype) => {
  try {
    const result = await cozyClient.stackClient.fetchJSON(
      'GET',
      `/data/${doctype}/_all_docs?include_docs=true`
    )
    return result.rows
      .filter(x => x.id.indexOf('_design') !== 0)
      .map(x => x.doc)
  } catch (e) {
    if (e.reason.reason == 'Database does not exist.') {
      return []
    }
    console.error(e)
    throw e
  }
}

module.exports = (cozyClient, doctypes, filename) => {
  log.debug('Exporting data...')

  const allExports = doctypes.map(doctype => {
    return fetchAll(cozyClient, doctype)
      .then(docs => {
        log.success('Exported documents for ' + doctype + ' : ' + docs.length)
        return docs
      })
      .catch(err => {
        console.error(err)
      })
  })

  return Promise.all(allExports)
    .then(function(data) {
      return _(doctypes)
        .zip(_.map(data, documents => _.map(documents, stripMeta)))
        .fromPairs()
        .value()
    })
    .then(data => {
      const json = JSON.stringify(data, null, 2)
      if (filename === '-' || !filename) {
        console.log(json)
      } else {
        return fs.writeFile(filename, json)
      }
    })
}
