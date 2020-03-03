const { ArgumentParser } = require('argparse')
const {
  createInstance,
  deleteInstance,
  createClientWithCurrentSession,
  setupCookieJar
} = require('./e2e-utils')

const parseArgs = () => {
  const parser = new ArgumentParser()

  parser.addArgument('--cookie-jar', { defaultValue: 'cookies.json' })

  const subparsers = parser.addSubparsers({
    title: 'Subcommands',
    dest: 'mode'
  })

  const createParser = subparsers.addParser('create', { addHelp: true })
  createParser.addArgument('--domain', { required: true })
  createParser.addArgument('--slug', { required: true })
  createParser.addArgument('--email', { required: true })
  createParser.addArgument('--account', { required: true })

  const deleteParser = subparsers.addParser('delete', { addHelp: true })
  deleteParser.addArgument('--uuid', { required: true })

  const createClient = subparsers.addParser('createClient', { addHelp: true })
  createClient.addArgument('--uri', {
    required: true
  })
  createClient.addArgument('--scope', {
    required: true,
    type: x => x.split(',')
  })
  createClient.addArgument('--software-id', {
    dest: 'softwareID',
    defaultValue: 'io.cozy.ach.e2e'
  })
  const args = parser.parseArgs()
  return args
}

const generatePassphrase = () => {
  // Passphrase will be unusable anyway since it is taken as a hash by the stack
  return 'hello'
}

const main = async () => {
  const args = parseArgs()

  const cookieJar = setupCookieJar(args.cookie_jar)

  if (args.mode === 'create') {
    const readyCozy = await createInstance(
      {
        account: args.account,
        domain: args.domain,
        slug: args.slug,
        email: args.email,
        passphrase: generatePassphrase()
      },
      cookieJar
    )
    console.log({
      cozy: readyCozy,
      cookieJar
    })
  } else if (args.mode === 'createClient') {
    const client = await createClientWithCurrentSession(
      {
        uri: args.uri,
        scope: args.scope,
        oauth: {
          softwareID: args.softwareID
        }
      },
      cookieJar
    )

    const { accessToken, refreshToken } = client.stackClient.token
    console.log('Access token', accessToken)
    console.log('Refresh token', refreshToken)
  } else if (args.mode === 'delete') {
    await deleteInstance(args.uuid)
  }
}

if (module === require.main) {
  main()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .then(() => {
      process.exit(0)
    })
}
