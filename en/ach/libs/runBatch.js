const PromisePool = require('es6-promise-pool')
const ACH = require('./ACH')
const log = require('./log')
const admin = require('./admin')
const config = require('./config')
const fs = require('fs')

const namespacedLogger = namespace => ({
  log: console.log.bind(console, namespace),
  warn: console.warn.bind(console, namespace),
  info: console.info.bind(console, namespace),
  error: console.error.bind(console, namespace)
})

const runScript = async (script, domain, globalCtx) => {
  const doctypes = script.getDoctypes()
  const token =
    process.env.BATCH_TOKEN || (await admin.createToken(domain, doctypes))

  const protocol = domain === 'cozy.localhost:8080' ? 'http' : 'https'
  const ach = new ACH(token, protocol + '://' + domain, doctypes)

  await ach.connect()

  const client = ach.client
  const logger = namespacedLogger(domain)

  return script.run({
    ...globalCtx,
    client,
    logger
  })
}

const makeResultFromError = err => ({
  error: {
    message: err.message,
    stack: err.stack
  }
})

const runScriptPool = function*(script, domains, globalCtx, progress) {
  let i = 0

  for (const domain of domains) {
    const onResultOrError = (domain => (type, res) => {
      if (type == 'catch') {
        res = makeResultFromError(res)
      }
      const data = { ...res, domain }
      i++
      progress(i, domains)
      return data
    })(domain)
    yield runScript(script, domain, globalCtx).then(
      onResultOrError.bind(null, 'then'),
      onResultOrError.bind(null, 'catch')
    )
  }
}

const progress = (i, arr) => {
  if (i % 50 === 0 || i == arr.length) {
    log.info(`Progress ${Math.round((i / arr.length) * 100, 2)}%`)
  }
}

/**
 * Reads a domain file into an Array
 *
 * Each domain is on 1 line
 * Empty lines ares removed
 */
const readDomainFile = filename => {
  return fs
    .readFileSync(filename)
    .toString()
    .split('\n')
    .filter(x => x != '')
}

/**
 * Provides a way to run a function across a large number of
 * cozies.
 *
 * @param  {Object}  options.script - { run, getDoctypes }
 * Must be an object containing
 *
 * - a `getDoctypes` function returning the doctypes needed for the script
 * - a `run` function that will receive a `context` object containing
 *   - `client`: an authorized CozyClient
 *   - `logger`: a logger namespaced with the domain of the cozy
 *   - `dryRun`: whether the script should be in dry-run mode
 *
 * @param  {Array}  options.domains     - List of cozy domains the script will be run on
 * @param  {String}  options.domainsFile - File containing a list of domains the script will run on
 * @param  {Boolean} options.dryRun - Will be passed by the `run` function that must handle it
 * @param  {Boolean} options.verbose - Whether each result of `run` should be logged to stdout
 *
 * @param  {Number}  options.limit
 * @param  {Number}  options.poolSize
 * @param  {String}  options.fromDomain
 * @return {Promise}
 */
const runBatch = async ({
  script,
  domains,
  domainsFile,
  limit = null,
  poolSize = 10,
  dryRun = true,
  fromDomain = null,
  logResults = true
}) => {
  await config.loadConfig()
  if (!domains && !domainsFile) {
    throw new Error(
      'runBatch: Invalid arguments. Need at least `domains` or `domainsFile`'
    )
  }
  domains = domains || readDomainFile(domainsFile)

  if (fromDomain) {
    const i = domains.findIndex(domain => domain === fromDomain)
    domains = domains.slice(i)
  }

  // An object that will be passed to functions run on each cozy
  // Can be used to store global stats
  const stats = {}

  // Will be spread into the context object passed to scripts'
  // `run` function
  const globalCtx = {
    stats,
    dryRun
  }

  const start = new Date()
  const pool = new PromisePool(
    runScriptPool(
      script,
      limit ? domains.slice(0, limit) : domains,
      globalCtx,
      progress
    ),
    poolSize
  )
  const results = []
  pool.addEventListener('fulfilled', function(event) {
    results.push(event.data.result)
    if (logResults) {
      console.log(JSON.stringify(event.data.result))
    }
  })
  await pool.start()
  const end = new Date()
  log.success(`Done in ${Math.round((end - start) / 1000, 2)}s`)
  return {
    results,
    stats
  }
}

module.exports = runBatch
