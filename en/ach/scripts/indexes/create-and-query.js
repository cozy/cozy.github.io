const mkAPI = require('../api')
const {
  N_DOCS,
  N_INDEXES,
  queryDocsByIndexes,
  indexedFields
} = require('./common')
const { DOCTYPE_DUMMY } = require('../../libs/doctypes')

const buildDocs = () => {
  const docs = []
  for (let i = 0; i < N_DOCS; i++) {
    let doc = {}
    for (let j = 0; j < N_INDEXES; j++) {
      const entry = {
        [j]: Math.floor(Math.random() * Math.floor(100))
      }
      doc = { ...doc, ...entry }
    }
    docs.push(doc)
  }
  return docs
}

const createOrResetDatabase = async (client, api) => {
  try {
    const docs = await api.fetchAll(DOCTYPE_DUMMY)
    await api.deleteAll(DOCTYPE_DUMMY, docs)

    const indexes = await client.fetchJSON(
      'GET',
      `/data/${DOCTYPE_DUMMY}/_design_docs`
    )
    for (const index of indexes.rows) {
      const ddoc = index.id.split('/')[1]
      const rev = index.value.rev
      await client.fetchJSON(
        'DELETE',
        `/data/${DOCTYPE_DUMMY}/_design/${ddoc}?rev=${rev}`
      )
    }
  } catch (err) {
    if (!err.message.match(/Database does not exist/)) {
      throw err
    }
    await api.createDoctype(DOCTYPE_DUMMY)
  }
}

const createDocs = async (api, docs) => {
  console.log(`Create ${docs.length} docs...`)
  return api.updateAll(DOCTYPE_DUMMY)
}

const createIndexes = async client => {
  console.log(`Create ${N_INDEXES} indexes...`)
  const fields = indexedFields()
  for (let i = 0; i < fields.length; i++) {
    const indexDef = {
      index: {
        fields: [fields[i].toString()]
      },
      ddoc: `_design/${fields[i]}`
    }
    await client.fetchJSON('POST', `/data/${DOCTYPE_DUMMY}/_index`, indexDef)
  }
}

/**
 * Create documents and query them through indexes
 */
module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_DUMMY]
  },
  run: async function(ach) {
    const api = mkAPI(ach.client)
    const client = ach.client

    await createOrResetDatabase(client, api)
    const docs = buildDocs()
    await createDocs(api, docs)
    await createIndexes(client)

    console.time(`Query ${N_INDEXES} indexes first time`)
    await queryDocsByIndexes(client)
    console.timeEnd(`Query ${N_INDEXES} indexes first time`)

    console.time(`Query ${N_INDEXES} indexes second time`)
    await queryDocsByIndexes(client)
    console.timeEnd(`Query ${N_INDEXES} indexes second time`)
  }
}
