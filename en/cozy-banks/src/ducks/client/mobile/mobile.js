/* global __APP_VERSION__ */

import CozyClient from 'cozy-client'
import { getDeviceName } from 'cozy-device-helper'

import { merge } from 'lodash'
import { getLinks } from '../links'
import { schema } from 'doctypes'
import manifest from 'ducks/client/manifest'
import pushPlugin from 'ducks/mobile/push'
import { clientPlugin as sentryPlugin } from 'lib/sentry'

import { SOFTWARE_ID } from 'ducks/mobile/constants'
import { getRedirectUri } from 'ducks/client/mobile/redirect'
import { resetFilterByDoc } from 'ducks/filters'

export const getScope = m => {
  if (m.permissions === undefined) {
    throw new Error(`Your manifest must have a 'permissions' key.`)
  }

  return Object.keys(m.permissions).map(permission => {
    const { type /*, verbs, selector, values*/ } = m.permissions[permission]

    return type
  })
}

export const getSoftwareName = m => {
  if (m.name === undefined) {
    throw new Error(`Your manifest must have a 'name' key.`)
  }

  return m.name_prefix ? `${m.name_prefix} ${m.name}` : m.name
}

export const getClientName = m => `${getSoftwareName(m)} (${getDeviceName()})`

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

// TODO: the revocation check via cozy-pouch-link should not be
// done in the app. We should find a way to have this in a shared
// repository, possibly in cozy-client or cozy-pouch-link
export const isRevoked = async client => {
  try {
    await client.stackClient.fetchInformation()
    return false
  } catch (err) {
    if (err.message && err.message.indexOf('Client not found') > -1) {
      return true
    } else {
      return false
    }
  }
}

const checkForRevocation = async client => {
  const revoked = await isRevoked(client)
  if (revoked) {
    client.stackClient.unregister()
    client.handleRevocationChange(true)
  }
}

const registerPlugin = (client, plugin) => {
  plugin(client)
}

const registerPluginsAndHandlers = (client, getStore) => {
  registerPlugin(client, pushPlugin)
  registerPlugin(client, sentryPlugin)

  client.on('logout', () => {
    const store = getStore()
    store.dispatch(resetFilterByDoc())
  })
}

export const getClient = (state, getStore) => {
  const manifestOptions = getManifestOptions(manifest)
  const appSlug = manifest.slug

  let client
  const banksOptions = {
    schema,
    oauth: {
      redirectURI: getRedirectUri(appSlug),
      softwareID: SOFTWARE_ID,
      softwareVersion: __APP_VERSION__,
      clientKind: 'mobile',
      clientURI: 'https://github.com/cozy/cozy-banks',
      logoURI:
        'https://downcloud.cozycloud.cc/upload/cozy-banks/email-assets/logo-bank.png',
      notificationPlatform: 'firebase'
    },
    links: getLinks({
      pouchLink: {
        onSyncError: async () => {
          checkForRevocation(client)
        }
      }
    })
  }

  client = new CozyClient(merge(manifestOptions, banksOptions))
  registerPluginsAndHandlers(client, getStore)
  return client
}
