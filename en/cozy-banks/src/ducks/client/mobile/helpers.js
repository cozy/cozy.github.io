import { getDeviceName } from 'cozy-device-helper'

import { SentryCozyClientPlugin as SentryPlugin } from 'lib/sentry'
import PushPlugin from 'ducks/mobile/push'

const getSoftwareName = m => {
  if (m.name === undefined) {
    throw new Error(`Your manifest must have a 'name' key.`)
  }

  return m.name_prefix ? `${m.name_prefix} ${m.name}` : m.name
}

const getClientName = m => `${getSoftwareName(m)} (${getDeviceName()})`

const getScope = m => {
  if (m.permissions === undefined) {
    throw new Error(`Your manifest must have a 'permissions' key.`)
  }

  return Object.keys(m.permissions).map(permission => {
    const { type /*, verbs, selector, values*/ } = m.permissions[permission]

    return type
  })
}

export const registerPluginsAndHandlers = client => {
  client.registerPlugin(PushPlugin)
  client.registerPlugin(SentryPlugin)
}

export const getManifestOptions = manifest => {
  const cozyPolicyURI = 'https://files.cozycloud.cc/cgu.pdf'

  return {
    oauth: {
      clientName: getClientName(manifest),
      policyURI: manifest.name_prefix === 'Cozy' ? cozyPolicyURI : '',
      scope: getScope(manifest)
    }
  }
}
