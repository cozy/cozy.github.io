const { DOCTYPE_FILES } = require('../libs/doctypes')
const mkAPI = require('./api')

const referencesToRemove = files => {
  const toRemove = {}
  files.forEach(file => {
    if (file.referenced_by) {
      const refs = file.referenced_by.map(ref => {
        return { data: ref }
      })
      toRemove[file._id] = refs
    }
  })
  return toRemove
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_FILES]
  },
  run: async function(ach, dryRun) {
    const client = ach.oldClient
    const api = mkAPI(client)

    const files = await api.fetchAll(DOCTYPE_FILES)
    const toRemove = referencesToRemove(files)

    if (dryRun) {
      console.log(`Would update ${Object.entries(toRemove).length} files`)
    } else {
      console.log(`Updating ${Object.entries(toRemove).length} files...`)
      for (const [id, refs] of Object.entries(toRemove)) {
        for (const ref of refs) {
          await client.fetchJSON(
            'DELETE',
            `/files/${id}/relationships/referenced_by`,
            ref
          )
        }
      }
    }
  },
  referencesToRemove: referencesToRemove
}
