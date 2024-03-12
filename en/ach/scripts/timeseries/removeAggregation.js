const { Q } = require('cozy-client')
const { DOCTYPE_GEOJSON } = require('../../libs/doctypes')

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_GEOJSON]
  },
  /**
   * FIXME: The params are an array passed to the scripts, here used to get the startDate
   * This seems rather fragile, and cannot be documented in the CLI
   * We need a better way to handle specific params for scripts
   */

  run: async function(ach, dryRun = true, params) {
    const client = ach.client
    if (dryRun) {
      console.log('This is a dry run, no doc will be updated')
    }

    const fromDate = params.length > 0 ? params[0] : null

    console.log(`Looking for docs with startDate above ${fromDate}`)
    const query = Q(DOCTYPE_GEOJSON)
      .where({
        aggregation: { $exists: true },
        startDate: {
          $gt: fromDate
        }
      })
      .limitBy(null)
    const docs = await client.queryAll(query)
    let newDocs = []
    if (dryRun) {
      console.log(`${docs.length} docs would be updated.`)
      return
    }
    console.log(`Remove ${docs.length} aggregation from timeseries...`)
    for (const doc of docs) {
      delete doc.aggregation
      newDocs.push(doc)
    }
    if (newDocs.length > 0) {
      await client.saveAll(newDocs)
    }
    console.log('Done!')
  }
}
