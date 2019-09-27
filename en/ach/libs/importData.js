const path = require('path')
const fs = require('fs')
const Handlebars = require('handlebars')
const dirTree = require('directory-tree')
const { merge, once } = require('lodash')
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

const singleQuoteString = function(value) {
  if (typeof value === 'string') {
    return `'${value}'`
  } else {
    return value
  }
}

/**
 * Creates a helper that will stay same after being processed by Handlebars
 *
 * There are two Handlebars passes on the data :
 *
 * 1. At load time to create dummy data
 * 2. When the data is being inserted so that we can reference data being created
 *
 * Since we need the `reference` helper to stay the same for the second pass, we
 * create it with `passthroughHelper`.
 *
 * @param  {string}   name     - The name of the created helper
 * @param  {function} callback - Callback to run when the helper is executed
 * @return {string}            - A helper that when called will creates itself
 *
 * @example
 * const reference = passthroughHelper('reference')
 * Handlebars.registerHelper({ reference })
 * const str = Handlebars.compile("{{ reference 'io.cozy.files' 0 '_id' }}")()
 * > str = "{{ reference 'io.cozy.files' 0 '_id' }}"
 */
const passthroughHelper = function(name, callback) {
  return function() {
    callback && callback()
    return new Handlebars.SafeString(
      `{{ ${name} ${Array.from(arguments)
        .slice(0, -1)
        .map(singleQuoteString)
        .join(' ')} }}`
    )
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

const parseBool = function(boolString, defaultVal) {
  return boolString === undefined ? defaultVal : boolString === 'true'
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
module.exports = (cozyUrl, token, filepath, handlebarsOptionsFile) => {
  if (!filepath) filepath = 'example-data.json'
  const dummyjson = require('dummy-json')
  const template = fs.readFileSync(filepath, { encoding: 'utf8' })
  const templateDir = path.dirname(path.resolve(filepath))

  // dummy-json pass helpers
  const options = { parallel: parseBool(process.env.ACH_PARALLEL, true) }
  const turnOffParallelism = once(function() {
    log.debug('Turning off parallelism since {{ reference }} helper is used.')
    options.parallel = false
  })

  let handlebarsOptions = {
    helpers: {
      dir: passthroughHelper('dir'),
      reference: passthroughHelper('reference', turnOffParallelism)
    }
  }

  if (handlebarsOptionsFile) {
    handlebarsOptions = merge(
      handlebarsOptions,
      require(path.resolve(`./${handlebarsOptionsFile}`))
    )
  }

  // dummy-json pass passthrough helpers
  const data = JSON.parse(dummyjson.parse(template, handlebarsOptions))
  const doctypes = Object.keys(data)

  // We register 2nd pass helpers
  H.registerHelper({
    dir: templateDir,
    reference: getMetadata
  })

  const ach = new ACH(token, cozyUrl, doctypes)
  return ach.connect().then(() => {
    return handleBadToken(importData(ach.client, data, options))
  })
}
