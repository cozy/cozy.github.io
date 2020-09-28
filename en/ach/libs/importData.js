const Handlebars = require('handlebars')
const dirTree = require('directory-tree')
const ACH = require('./ACH')
const log = require('./log')
const { uploadFile, handleBadToken } = require('./utils')
const { runSerially, runInPoolAfterFirst, tee } = require('./promises')

const FILE_DOCTYPE = 'io.cozy.files'
const H = Handlebars.create()

const assert = function(cond, msg) {
  if (!cond) {
    throw new Error(msg)
  }
}

// We save results from cozy imports here
// to be able to retrieve it inside the template
// It is useful when a document needs to be able
// to reference another one
const metadata = {}
const saveMetadata = function(doctype, result) {
  metadata[doctype] = metadata[doctype] || []
  metadata[doctype].push(result)
}

const getMetadata = function(doctype, index, field) {
  try {
    return metadata[doctype][index][field]
  } catch (e) {
    console.warn('Could not find any metadata for ', doctype, index)
    throw e
  }
}

const runTemplate = function(str) {
  return H.compile(str)({})
}

const applyHelpers = function(data) {
  return JSON.parse(runTemplate(JSON.stringify(data)))
}

const dirname = path =>
  path
    .split('/')
    .slice(0, -1)
    .join('/')

/**
 * If the document is a file, will take appropriate action to have it
 * uploaded, looks at the __SRC__ and __DEST__ fields of the document
 * to know where is the file and where to put it.
 */
const createDocumentFromDescription = async function(client, doctype, data) {
  if (doctype === FILE_DOCTYPE) {
    const src = data.__SRC__
    const dest = data.__DEST__
    if (!src || !dest) {
      throw new Error('No src/dest')
    }
    const fileJSON = dirTree(src)
    if (!fileJSON) {
      throw new Error('File error ' + src)
    }
    return uploadFile(client, fileJSON, dirname(dest), true)
  } else {
    const references = data.__REFERENCES__
    delete data.__REFERENCES__
    const doc = await client.data.forceCreate(doctype, data)
    if (references) {
      await client.data.addReferencedFiles(doc, references)
    }
    return doc
  }
}

/**
 * Create a document from the JSON description.
 *
 * - Process the JSON to have access to the metadata helper
 *   if we need to access data from objects that just have
 *   been created
 * - Saves the returned metadata in the metadata object if we
 * need it to access it with the metadata helper.
 *
 * @param  {CozyClient} client  - Cozy client
 * @param  {String} doctype
 * @param  {Object} data    - Document to be created
 * @return {Promise}
 */
const createDoc = async function(client, doctype, data) {
  assert(doctype, 'Must pass a doctype, you passed ' + doctype)
  assert(data, 'Must pass data, you passed ' + data)
  data = applyHelpers(data)
  try {
    const result = await createDocumentFromDescription(
      client,
      doctype,
      data,
      true
    )
    saveMetadata(doctype, result)
    return result
  } catch (err) {
    log.error('Oops! An error occured.')
    if (err.name === 'FetchError' && err.status === 400) {
      log.error(err.reason.error)
    } else if (err.name === 'FetchError' && err.status === 403) {
      log.info(
        'The server replied with 403 forbidden; are you sure the last generated token is still valid and has the correct permissions?'
      )
    } else if (err.name === 'FetchError' && err.status === 409) {
      log.error('Document update conflict: ' + err.url)
    } else {
      log.error(err)
    }
    throw err
  }
}

/**
 * @return {function} - Progress logger when importing documents
 */
const progressReport = options => {
  let i = 0
  const { docs, doctype } = options
  return tee(() => {
    i++
    if (i % options.every == 0 || i === docs.length) {
      console.log(doctype + ': ' + ((i / docs.length) * 100).toFixed(2) + '%')
    }
  })
}

const importData = async function(cozyClient, data, options) {
  // Even if we are in parallel mode, insert the first document serially, and then all the other ones in parallel.
  // because if it's a new doctype, the stack needs time to create the collection
  // and can't handle the other incoming requests

  const CONCURRENCY = 25
  const runPerDocument = options.parallel
    ? runInPoolAfterFirst(CONCURRENCY)
    : runSerially

  for (let doctype of Object.keys(data)) {
    let docs = data[doctype]

    const hasDocs = docs && docs.length && docs.length > 0
    if (!hasDocs) {
      console.warn('No documents for doctype ' + doctype)
      continue
    }

    console.log(`Importing ${docs.length} documents for doctype ${doctype}...`)

    const report = progressReport({
      doctype,
      docs,
      every: 50
    })
    const createWithProgress = doc =>
      createDoc(cozyClient, doctype, doc).then(report)
    try {
      const results = await runPerDocument(docs, createWithProgress)
      console.log(
        'Imported ' +
          results.length +
          ' ' +
          doctype +
          ' document' +
          (results.length > 1 ? 's' : '')
      )
    } catch (error) {
      throw new Error(error)
    }
  }
  return true
}

/**
 * Imports data from a JSON file
 *
 * The JSON is processed with dummy-json so that fixtures can be created easily.
 *
 * Objects can also reference the current directory of the file with {{ dir }}
 * and reference objects created before them with {{ reference doctype index field }}
 *
 */
module.exports = (cozyUrl, token, data, templateDir, options) => {
  const doctypes = Object.keys(data)

  // We register 2nd pass helpers
  H.registerHelper({
    dir: templateDir,
    reference: getMetadata
  })

  const ach = new ACH(token, cozyUrl, doctypes)
  return ach.connect().then(() => {
    return handleBadToken(importData(ach.oldClient, data, options))
  })
}
