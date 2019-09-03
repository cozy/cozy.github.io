const PromisePool = require('es6-promise-pool')
const ACH = require('./ACH')
const log = require('./log')
const admin = require('./admin')
const config = require('./config')
const fs = require('fs')

const runScript = async (script, domain, dryRun) => {
  const doctypes = script.getDoctypes()
  const token =
    process.env.BATCH_TOKEN || (await admin.createToken(domain, doctypes))
  const protocol = domain === 'cozy.tools:8080' ? 'http' : 'https'
  const ach = new ACH(token, protocol + '://' + domain, doctypes)
  await ach.connect()
  return script.run(ach, dryRun)
}

const runScriptPool = function*(script, domains, progress, dryRun) {
  let i = 0

  for (const domain of domains) {
    const onResultOrError = (domain => res => {
      if (res instanceof Error) {
        res = { message: res.message, stack: res.stack }
      }
      i++
      console.log(JSON.stringify({ ...res, domain }))
      progress(i, domains)
    })(domain)
    yield runScript(script, domain, dryRun).then(
      onResultOrError,
      onResultOrError
    )
  }
}

const progress = (i, arr) => {
  if (i % 50 === 0 || i == arr.length) {
    log.info(`Progress ${Math.round((i / arr.length) * 100, 2)}%`)
  }
}

const runBatch = async ({
  script,
  domainsFile,
  limit,
  poolSize,
  dryRun,
  fromDomain
}) => {
  await config.loadConfig()
  let domains = fs
    .readFileSync(domainsFile)
    .toString()
    .split('\n')
    .filter(x => x != '')

  if (fromDomain) {
    const i = domains.findIndex(domain => domain === fromDomain)
    domains = domains.slice(i)
  }

  const start = new Date()
  const pool = new PromisePool(
    runScriptPool(
      script,
      limit ? domains.slice(0, limit) : domains,
      progress,
      dryRun
    ),
    poolSize
  )
  await pool.start()
  const end = new Date()
  log.success(`Done in ${Math.round((end - start) / 1000, 2)}s`)
}

module.exports = runBatch
