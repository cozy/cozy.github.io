import 'module-alias/register'
import fs from 'fs'
import path from 'path'

/* eslint-disable no-console */
import { ArgumentParser } from 'argparse'
import { createClientInteractive } from 'cozy-client/dist/cli'
import { schema } from 'doctypes'
import appMetadata from 'ducks/client/appMetadata'
import runExportService from '../targets/services/export'
import runImportService from '../targets/services/import'
import runRecurrenceService from '../ducks/recurrence/service'
import runKonnectorAlertsService from '../targets/services/konnectorAlerts'

global.__POUCH__ = false
global.__DEV__ = false

const serviceEntrypoints = {
  export: runExportService,
  import: runImportService,
  recurrence: runRecurrenceService,
  konnectorAlerts: runKonnectorAlertsService
}

export const getScope = m => {
  if (m.permissions === undefined) {
    throw new Error(`Your manifest must have a 'permissions' key.`)
  }

  return Object.keys(m.permissions).map(permission => {
    const { type /* , verbs, selector, values*/ } = m.permissions[permission]

    return type
  })
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../manifest.webapp'))
)

const main = async () => {
  const parser = new ArgumentParser()
  parser.addArgument('service', {
    choices: Object.keys(serviceEntrypoints)
  })
  parser.addArgument('--url', { defaultValue: 'http://cozy.tools:8080' })
  const args = parser.parseArgs()
  const client = await createClientInteractive({
    uri: args.url,
    scope: getScope(manifest),
    schema,
    appMetadata,
    oauth: {
      softwareID: 'banks.service-cli'
    }
  })
  const serviceEntrypoint = serviceEntrypoints[args.service]
  await serviceEntrypoint({ client })
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
