process.env.NODE_ENV = 'development'

const fs = require('fs')
const path = require('path')
const {
  runService,
  toMatchSnapshot,
  ach,
  makeToken,
  prompt,
  couch
} = require('./utils')
const get = require('lodash/get')
const log = require('cozy-logger').namespace('e2e-onOperationOrBillCreate')

const assert = (cond, msg) => {
  if (!cond) {
    throw new Error(msg)
  }
}

const PREFIX = 'cozy-banks-e2e-onOperationOrBillCreate'

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

const isJSONFile = filename => filename.endsWith('.json')

const loadData = async () => {
  log('info', 'Loading data...')
  const dir = 'test/fixtures/matching-service'
  for (let fixture of fs.readdirSync(dir).filter(isJSONFile)) {
    ach(['import', path.join(dir, fixture)])
  }
}

const exportAndSnapshot = async () => {
  log('info', 'Exporting and snapshotting...')
  const exportFilename = `/tmp/${PREFIX}-export.json`
  ach(['export', 'io.cozy.bank.operations,io.cozy.bills', exportFilename])
  const actual = fs.readFileSync(exportFilename).toString()
  const testTitle = 'onOperationOrBillCreate'
  const filename = path.basename(__filename)
  const snapResult = toMatchSnapshot(actual, filename, testTitle)
  if (snapResult.pass) {
    log('info', 'Snapshot OK !')
  } else {
    console.error(snapResult.report()) // eslint-disable-line no-console
    throw new Error('Snapshot not OK')
  }
}

const checkSettings = async () => {
  const res = ach(['export', 'io.cozy.bank.settings'], {
    stdio: 'pipe'
  })
  const data = JSON.parse(res.stdout.toString())
  const settings = data['io.cozy.bank.settings']
  const settingDoc = settings[0]
  assert(settings.length == 1, 'There should be only 1 setting document')

  const definedPaths = [
    'appSuggestions.lastSeq',
    'billsMatching.transactionsLastSeq',
    'billsMatching.billsLastSeq',
    'notifications.lastSeq'
  ]
  for (let path of definedPaths) {
    assert(
      typeof get(settingDoc, path) !== 'undefined',
      `settings.${path} should not be undefined`
    )
  }
}

const testService = async options => {
  await dropData()
  await loadData()
  await runService('onOperationOrBillCreate', [JSON.stringify(options)])
  await exportAndSnapshot()
  await checkSettings()
}

const main = async () => {
  const e = await prompt('Clear data and run e2e test (y) ?')
  if (e !== 'y') {
    log('info', 'Aborting...')
    return
  }
  await makeToken(PREFIX)
  await testService({ transactionMatching: false })
  await testService({ billMatching: false })
}

main().catch(e => {
  console.error(e) // eslint-disable-line no-console
  process.exit(1)
})
