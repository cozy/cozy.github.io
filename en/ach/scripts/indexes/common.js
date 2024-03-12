const { DOCTYPE_DUMMY } = require('../../libs/doctypes')

const N_DOCS = 1000
const N_INDEXES = 50

module.exports.DOCTYPE_DUMMY = DOCTYPE_DUMMY
module.exports.N_DOCS = N_DOCS
module.exports.N_INDEXES = N_INDEXES

module.exports.queryDocsByIndexes = async (
  client,
  { useIndexCopy = false } = {}
) => {
  const fields = indexedFields()

  for (let i = 0; i < fields.length; i++) {
    const indexId = useIndexCopy
      ? `_design/${fields[i]}_copy`
      : `_design/${fields[i]}`
    const query = {
      selector: {
        [fields[i]]: {
          $gt: null
        }
      },
      use_index: indexId
    }
    await client.fetchJSON('POST', `/data/${DOCTYPE_DUMMY}/_find`, query)
  }
}

const indexedFields = () => {
  const fields = []
  for (let i = 0; i < N_INDEXES; i++) {
    fields.push(i)
  }
  return fields
}

module.exports.indexedFields = indexedFields
