const { N_INDEXES, queryDocsByIndexes, indexedFields } = require('./common')
const { DOCTYPE_DUMMY } = require('../../libs/doctypes')

const getIndex = async (client, ddoc) => {
  return client.fetchJSON('GET', `/data/${DOCTYPE_DUMMY}/_design/${ddoc}`)
}

const copyIndexes = async client => {
  const fields = indexedFields()
  console.log(`Copy ${fields.length} indexes...`)

  for (let i = 0; i < fields.length; i++) {
    const index = await getIndex(client, fields[i])
    const ddoc = index._id.split('/')[1]
    const rev = index._rev
    const options = {
      headers: {
        Destination: `_design/${fields[i]}_copy`
      }
    }
    await client.fetchJSON(
      'POST',
      `/data/${DOCTYPE_DUMMY}/_design/${ddoc}/copy?rev=${rev}`,
      null,
      options
    )
  }
}

/**
 * Copy existing indexes and query documents
 */
module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_DUMMY]
  },
  run: async function(ach) {
    const client = ach.client

    console.time(`Copy ${N_INDEXES} indexes`)
    await copyIndexes(client)
    console.timeEnd(`Copy ${N_INDEXES} indexes`)

    console.time(`Query ${N_INDEXES} indexes`)
    await queryDocsByIndexes(client, { useIndexCopy: true })
    console.timeEnd(`Query ${N_INDEXES} indexes`)
  }
}
