const {
  DOCTYPE_FILES,
  DOCTYPE_BANK_ACCOUNTS,
  DOCTYPE_BANK_TRANSACTIONS,
  DOCTYPE_BILLS,
  DOCTYPE_ALBUMS
} = require('../../libs/doctypes')
const { queryAll } = require('../libs/utils')
const PromisePool = require('es6-promise-pool')

const ALREADY_IN_TRASH = 'File or directory is already in the trash'

let client

const isDemoDocument = function(document) {
  if (document.demo) {
    return true
  } else if (document._id.length < 32) {
    return true
  } else if (
    document.description ==
    'Premier compte sans connaitre l id pour generer le doc'
  ) {
    return true
  } else if (document.name && document.name.indexOf('Demo') > -1) {
    return true
  } else if (document.path && document.path.indexOf('démo') > -1) {
    return true
  } else if (
    document.referenced_by &&
    document.referenced_by.length === 1 &&
    document.referenced_by[0].id &&
    document.referenced_by[0].id.indexOf('demo') > -1
  ) {
    return true
  } else {
    return false
  }
}

const dropDocuments = (doctype, documents, batchSize = 10) => {
  let i = 0
  const producer = () => {
    const doc = documents[i++]
    if (!doc) {
      return null
    } else {
      if (doctype == DOCTYPE_FILES) {
        return client.files.trashById(doc._id).catch(err => {
          if (
            err.errors &&
            err.errors.length === 1 &&
            err.errors[0].detail == ALREADY_IN_TRASH
          ) {
            console.log('File already in trash, passing...')
          }
        })
      } else {
        return client.data.delete(doctype, doc)
      }
    }
  }
  // Create a pool.
  const pool = new PromisePool(producer, batchSize)
  return pool.start()
}

const deleteDemoDocuments = async function(doctype, dryRun) {
  const index = await client.data.defineIndex(doctype, ['_id'])
  const documents = await queryAll(client, index, {
    selector: { _id: { $gt: null } },
    descending: true
  })
  const demoDocuments = documents.filter(isDemoDocument)
  const realDocuments = documents.filter(x => !isDemoDocument(x))
  if (demoDocuments.length) {
    console.log(`Found ${demoDocuments.length} demo ${doctype} documents.`)
  }
  if (realDocuments.length) {
    console.log(`Found ${realDocuments.length} real ${doctype} documents.`)
  }

  if (!dryRun) {
    return dropDocuments(doctype, demoDocuments)
  }
}

module.exports = {
  getDoctypes: function() {
    return [
      DOCTYPE_BANK_ACCOUNTS,
      DOCTYPE_BANK_TRANSACTIONS,
      DOCTYPE_BILLS,
      DOCTYPE_FILES,
      DOCTYPE_ALBUMS
    ]
  },
  run: async function(ach, dryRun) {
    client = ach.oldClient
    await deleteDemoDocuments(DOCTYPE_BANK_ACCOUNTS, dryRun)
    await deleteDemoDocuments(DOCTYPE_BANK_TRANSACTIONS, dryRun)
    await deleteDemoDocuments(DOCTYPE_BILLS, dryRun)
    await deleteDemoDocuments(DOCTYPE_FILES, dryRun)
    await deleteDemoDocuments(DOCTYPE_ALBUMS, dryRun)
  }
}
