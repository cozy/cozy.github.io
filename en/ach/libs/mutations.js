const intersection = require('lodash/intersection')
const some = require('lodash/some')
const keyBy = require('lodash/keyBy')
const jestDiff = require('jest-diff')

const displayBulkResult = res => {
  if (some(res, x => x.error)) {
    for (const error of res.filter(x => x.error)) {
      console.warn('⚠️', error)
    }
  } else {
    console.log('✅ OK')
  }
}

const ensureNoConflicts = mutation => {
  for (const [doctype, updated] of Object.entries(mutation.toUpdate)) {
    const deleted = mutation.toDelete[doctype] || []
    const conflicts = intersection(
      updated.map(x => x._id),
      deleted.map(x => x._id)
    )
    if (conflicts.length > 0) {
      throw new Error('Conflict detected')
    }
  }
}

const defaulted = mutation_ => ({
  toUpdate: {},
  toDelete: {},
  ...mutation_
})

const mutations = {
  execute: async (mutation_, api) => {
    const mutation = defaulted(mutation_)
    ensureNoConflicts(mutation)
    for (const [doctype, docs] of Object.entries(mutation.toUpdate)) {
      console.log('Updating', docs.length, 'documents')
      const res = await api.updateAll(doctype, docs)
      displayBulkResult(res)
    }
    for (const [doctype, docs] of Object.entries(mutation.toDelete)) {
      console.log('Deleting', docs.length, 'documents')
      const res = await api.deleteAll(doctype, docs)
      displayBulkResult(res)
    }
    return true
  },
  display: mutation_ => {
    const mutation = defaulted(mutation_)
    for (const [doctype, docs] of Object.entries(mutation.toUpdate)) {
      if (!docs || docs.length === 0) {
        continue
      }
      const originalDocs = mutation.originals
        ? mutation.originals[doctype] || []
        : []
      const originalsById = keyBy(originalDocs, x => x._id)
      if (mutation.originals) {
        for (const doc of docs) {
          const original = originalsById[doc._id]
          console.log(
            jestDiff(doc, original)
              .split('\n')
              .slice(2)
              .join('\n')
          )
        }
      }
      console.log(`Would update ${doctype} ${docs.length} docs`)
    }
    for (const [doctype, docs] of Object.entries(mutation.toDelete)) {
      if (!docs || docs.length === 0) {
        continue
      }
      console.log(`Would delete ${doctype} ${docs.length} docs`)
    }
  }
}

module.exports = mutations
