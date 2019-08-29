const readline = require('readline')
const fs = require('fs')
const childProcess = require('child_process')
const fetch = require('node-fetch')
const { SnapshotState, toMatchSnapshot } = require('jest-snapshot')
const log = require('cozy-logger').namespace('e2e-utils')
const any = require('lodash/some')

function toMatchSnapshotStandalone(actual, testFile, testTitle) {
  // Intilize the SnapshotState, it's responsible for actually matching
  // actual snapshot with expected one and storing results to `__snapshots__` folder
  const snapshotState = new SnapshotState(testFile, {
    updateSnapshot: process.env.SNAPSHOT_UPDATE ? 'all' : 'new'
  })

  // Bind the `toMatchSnapshot` to the object with snapshotState and
  // currentTest name, as `toMatchSnapshot` expects it as it's `this`
  // object members
  const matcher = toMatchSnapshot.bind({
    snapshotState,
    currentTestName: testTitle
  })

  // Execute the matcher
  const result = matcher(actual)

  // Store the state of snapshot, depending on updateSnapshot value
  snapshotState.save()

  // Return results outside
  return result
}

const spawn = async (program, cliArgs, options = {}) => {
  return new Promise((resolve, reject) => {
    log('debug', `Spawning ${(program, cliArgs.join(' '))}`)
    const sp = childProcess.spawn(program, cliArgs, {
      stdio: 'inherit',
      ...options
    })
    sp.on('data', options.onData || console.log.bind(console)) // eslint-disable-line no-console
    sp.on('exit', resolve)
    sp.on('error', reject)
  })
}

const endsWith = (str, suffix) => {
  return str.indexOf(suffix) === str.length - suffix.length
}

const prompt = qs => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise(resolve => {
    rl.question(qs + ' ', answer => {
      rl.close()
      resolve(answer)
    })
  })
}

const dot2dash = x => x.replace(/\./g, '-')

const couch = {
  URL: 'http://localhost:5984',
  doctypeMatchesDatabase: (dbName, doctype) => {
    return endsWith(dbName, dot2dash(doctype))
  },
  listDatabases: () => {
    return fetch(`${couch.URL}/_all_dbs`).then(response => response.json())
  },

  dropDatabases: async doctypes => {
    const allDbs = await couch.listDatabases()
    const dbs = allDbs.filter(dbName =>
      any(
        doctypes.map(doctype => couch.doctypeMatchesDatabase(dbName, doctype))
      )
    )
    for (let db of dbs) {
      log('info', `Deleting ${db}...`)
      await fetch(`${couch.URL}/${encodeURIComponent(db)}`, {
        method: 'DELETE'
      })
    }
  }
}

const credentialsFromACHTokenFile = tokenFile => {
  const accessToken = JSON.parse(fs.readFileSync(tokenFile)).token
  return {
    client: {
      registrationAccessToken: 'Fake.Fake.Fake',
      redirectURI: 'http://localhost:3333/do_access',
      clientName: 'konnector-13'
    },
    token: {
      accessToken: accessToken
    }
  }
}

module.exports = {
  toMatchSnapshot: toMatchSnapshotStandalone,
  spawn,
  couch,
  endsWith,
  prompt,
  credentialsFromACHTokenFile
}
