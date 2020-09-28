const { ACH } = require('./libs')

let client,
  data,
  files,
  intents,
  jobs,
  offline,
  settings,
  auth,
  fetchJSON,
  token

const doctypes = process.env.DOCTYPES ? process.env.DOCTYPES.split(',') : []
const domain = process.env.COZY_URL || 'http://cozy.tools:8080'
console.log(doctypes)
const ach = new ACH(
  '/tmp/repl-ach.json',
  domain,
  doctypes.concat(['io.cozy.files', 'io.cozy.settings'])
)

const onConnection = () => {
  client = ach.client
  data = ach.oldClient.data
  files = ach.oldClient.files
  intents = ach.oldClient.intents
  jobs = ach.oldClient.jobs
  offline = ach.oldClient.offline
  settings = ach.oldClient.settings
  auth = ach.oldClient.auth
  fetchJSON = ach.oldClient.fetchJSON
  token = client._token.token
  console.log('token', token)
  console.log('Connected !')
}

const run = function() {
  return ach
    .connect()
    .then(onConnection)
    .then(() => ({
      client,
      data,
      files,
      intents,
      jobs,
      offline,
      settings,
      auth,
      fetchJSON,
      ach
    }))
}

module.exports = run
