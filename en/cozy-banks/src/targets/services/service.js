import fetch from 'node-fetch'
global.fetch = fetch

import CozyClient from 'cozy-client'
import { Document } from 'cozy-doctypes'
import flag from 'cozy-flags'
import logger from 'cozy-logger'

import { schema } from 'doctypes'
import { fetchSettings } from 'ducks/settings/helpers'
import appMetadata from 'ducks/client/appMetadata'

const log = logger.namespace('service')

export const runService = async service => {
  const client = CozyClient.fromEnv(process.env, {
    schema,
    appMetadata
  })
  Document.registerClient(client)
  client.registerPlugin(flag.plugin)
  await client.plugins.flags.initializing
  const settings = await fetchSettings(client)
  const localModelOverrideValue = settings.community.localModelOverride.enabled
  log('info', 'Setting local model override flag to ' + localModelOverrideValue)
  flag('local-model-override', localModelOverrideValue)

  return service({ client }).catch(e => {
    // eslint-disable-next-line no-console
    console.error('❗ The service catched an error:', e)
    process.exit(1)
  })
}

export const lang = process.env.COZY_LOCALE || 'en'
export const dictRequire = lang => require(`locales/${lang}`)
