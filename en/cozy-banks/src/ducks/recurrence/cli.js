import 'module-alias/register'
import fs from 'fs'
import path from 'path'

/* eslint-disable no-console */
import { ArgumentParser } from 'argparse'
import { createClientInteractive } from 'cozy-client/dist/cli'
import { doRecurrenceMatching } from './service'
global.__POUCH__ = false
global.__DEV__ = false

export const getScope = m => {
  if (m.permissions === undefined) {
    throw new Error(`Your manifest must have a 'permissions' key.`)
  }

  return Object.keys(m.permissions).map(permission => {
    const { type /*, verbs, selector, values*/ } = m.permissions[permission]

    return type
  })
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../manifest.webapp'))
)

const main = async () => {
  const parser = new ArgumentParser()
  parser.addArgument('--url', { defaultValue: 'http://cozy.tools:8080' })
  const args = parser.parseArgs()
  const client = await createClientInteractive({
    uri: args.url,
    scope: getScope(manifest),
    oauth: {
      softwareID: 'banks.recurrence-cli'
    }
  })
  await doRecurrenceMatching(client)
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
