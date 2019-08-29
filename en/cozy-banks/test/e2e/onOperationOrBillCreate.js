process.env.NODE_ENV = 'development'

const fs = require('fs')
const path = require('path')
const {
  credentialsFromACHTokenFile,
  toMatchSnapshot,
  spawn,
  prompt,
  couch
} = require('./utils')
const log = require('cozy-logger').namespace('e2e-onOperationOrBillCreate')

const PREFIX = 'cozy-banks-e2e-onOperationOrBillCreate'
const TOKEN_FILE = `/tmp/${PREFIX}-token.json`

/**
 * Spawns ACH, adds token argument automatically
 */
const ach = args => {
  args = args.slice()
  args.splice(1, 0, '-t', TOKEN_FILE)
  log('debug', JSON.stringify(args))
  return spawn('ACH', args)
}

const makeToken = async () => {
  log('info', 'Making token...')
  await spawn('bash', [
    '-c',
    `scripts/make-token cozy.tools:8080 | jq -R '{token: .}' > ${TOKEN_FILE}`
  ])
}

const dropData = async () => {
  log('info', 'Dropping data...')
  const doctypes = [
    'io.cozy.bank.operations',
    'io.cozy.bills',
    'io.cozy.bank.settings',
    'io.cozy.bank.accounts'
  ]
  return couch.dropDatabases(doctypes)
}

const loadData = async () => {
  log('info', 'Loading data...')
  const dir = 'test/fixtures/matching-service'
  for (let fixture of fs.readdirSync(dir)) {
    await ach(['import', path.join(dir, fixture)])
  }
}

const exportAndSnapshot = async () => {
  log('info', 'Exporting and snapshotting...')
  const exportFilename = `/tmp/${PREFIX}-export.json`
  await ach(['export', 'io.cozy.bank.operations,io.cozy.bills', exportFilename])
  const actual = fs.readFileSync(exportFilename).toString()
  const testTitle = 'onOperationOrBillCreate'
  const snapResult = toMatchSnapshot(actual, __filename, testTitle)
  if (snapResult.pass) {
    log('info', 'Snapshot OK !')
  } else {
    console.error(snapResult.report()) // eslint-disable-line no-console
    throw new Error('Snapshot not OK')
  }
}

const runService = async options => {
  log('info', 'Running service...')
  process.env.COZY_URL = 'http://cozy.tools:8080'
  process.env.COZY_CREDENTIALS = JSON.stringify(
    credentialsFromACHTokenFile(TOKEN_FILE)
  )
  await spawn('node', [
    'build/onOperationOrBillCreate.js',
    JSON.stringify(options)
  ])
}

const testService = async options => {
  await dropData()
  await loadData()
  await runService(options)
  await exportAndSnapshot()
}

const main = async () => {
  const e = await prompt('Clear data and run e2e test (y) ?')
  if (e !== 'y') {
    log('info', 'Aborting...')
    return
  }
  await makeToken()
  await testService({ transactionMatching: false })
  await testService({ billMatching: false })
}

main().catch(e => {
  console.error(e) // eslint-disable-line no-console
  process.exit(1)
})
