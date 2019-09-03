const mkAPI = client => {
  const api = {
    createDoctype: async doctype => {
      try {
        return await client.fetchJSON('PUT', `/data/${doctype}/`)
      } catch (e) {
        if (e.reason && e.reason.error === 'file_exists') {
          return {
            ok: true,
            alreadyExists: true
          }
        }
        throw e
      }
    },

    fetchAll: async doctype => {
      try {
        const result = await client.fetchJSON(
          'GET',
          `/data/${doctype}/_all_docs?include_docs=true`
        )
        return result.rows
          .filter(x => x.id.indexOf('_design') !== 0)
          .map(x => x.doc)
      } catch (e) {
        if (e.reason && e.reason.reason == 'Database does not exist.') {
          return []
        }
        throw e
      }
    },

    update: (doctype, doc) => {
      return client.fetchJSON('POST', `/data/${doctype}/`, doc)
    },

    updateAll: async (doctype, docs) => {
      if (!docs || docs.length === 0) {
        return []
      }
      return client.fetchJSON('POST', `/data/${doctype}/_bulk_docs`, { docs })
    },

    deleteAll: async (doctype, docs) => {
      console.log('Deleting', doctype, docs.map(x => x._id))
      return api.updateAll(doctype, docs.map(x => ({ ...x, _deleted: true })))
    },
    client
  }

  return api
}

module.exports = mkAPI
