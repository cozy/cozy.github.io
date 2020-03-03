const path = require('path')
const fs = require('fs')
const { spawnSync } = require('child_process')
const data = require('./data.json')
const { setupE2EInstance, deleteInstance } = require('./e2e-utils')

const TOKEN_FILE = '/tmp/token-e2e-scenarios-ach.json'

const sec = 1000
const launchACHCommand = args => {
  const fullArgs = [...args, '-t', TOKEN_FILE, '--url', client.stackClient.uri]
  const res = spawnSync('ACH', fullArgs)
  if (res.status !== 0) {
    console.log('stdout', res.stdout.toString())
    console.log('stderr', res.stdout.toString())
  }
  return res
}

let cozySlug, instanceInfo, client

beforeAll(async () => {
  const e2eInstance = await setupE2EInstance({
    uuidBackupFilename: path.join(__dirname, 'uuids.json'),
    cookieJarFilename: path.join(__dirname, './cookie-tests.json'),
    domain: 'cozy.wtf',
    email: 'patrick@cozycloud.cc',
    account: 'patrick@cozycloud.cc'
  })
  client = e2eInstance.client
  instanceInfo = e2eInstance.instanceInfo
  const accessToken = client.stackClient.token.accessToken
  fs.writeFileSync(
    TOKEN_FILE,
    JSON.stringify({
      token: accessToken
    })
  )
}, 60 * sec)

afterAll(async () => {
  if (!instanceInfo) {
    return
  }
  if (process.env.CI) {
    console.log(`Deleting ${instanceInfo._id} (${cozySlug})...`)
    const deleteResp = await deleteInstance(instanceInfo._id)
    console.log(deleteResp)
  }
})

const describer = process.env.CLOUDERY_TOKEN ? describe : xdescribe

describer('e2e scenario', () => {
  it('should work', () => {
    launchACHCommand(['import', path.join(__dirname, 'data.json')])
    const res = launchACHCommand(['export', 'io.cozy.tests'])
    expect(JSON.parse(res.stdout.toString())).toEqual(data)
    launchACHCommand(['drop', 'io.cozy.tests', '-y'])
    const res2 = launchACHCommand(['export', 'io.cozy.tests'])
    expect(JSON.parse(res2.stdout.toString())).toEqual({
      'io.cozy.tests': []
    })
  })
})
