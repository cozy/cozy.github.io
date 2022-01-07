const readline = require('readline')
const { ArgumentParser } = require('argparse')
const WebSocket = require('ws')

const { createClientInteractive } = require('cozy-client/dist/cli')
const CozyRealtime = require('../../dist').default

global.WebSocket = WebSocket

const prompt = promptMsg =>
  new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(promptMsg, answer => {
      resolve(answer)
      rl.close()
    })
  })

let myId

const CHANNEL_DOCTYPE = 'io.cozy.channels'
const CHANNEL_ID = 'example-chat'

const handleNotification = doc => {
  if (doc.data.producerId !== myId) {
    console.log(`${doc.data.producerId}: ${doc.data.message}`)
  }
}

const parseArgs = () => {
  const parser = new ArgumentParser()
  parser.addArgument('name', { help: 'Name used inside chat' })
  parser.addArgument('--url', {
    help: 'HTTP URL of Cozy',
    defaultValue: 'http://cozy.tools:8080'
  })
  return parser.parseArgs()
}

const main = async () => {
  const args = parseArgs()
  const client = await createClientInteractive({
    uri: args.url,
    scope: [CHANNEL_DOCTYPE],
    oauth: {
      softwareID: 'adhoc.test-realtime'
    }
  })

  const realtime = new CozyRealtime({
    client
  })

  await realtime.subscribe(
    'notified',
    CHANNEL_DOCTYPE,
    CHANNEL_ID,
    handleNotification
  )

  myId = args.name

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const message = await prompt('> ')
    realtime.send(CHANNEL_DOCTYPE, CHANNEL_ID, { producerId: myId, message })
  }
}

// eslint-disable-next-line promise/catch-or-return
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  // eslint-disable-next-line promise/always-return
  .then(() => {
    process.exit(0)
  })
