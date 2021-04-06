/* global __APP_VERSION__ */

import CozyClient from 'cozy-client'
import { getDeviceName } from 'cozy-device-helper'

import merge from 'lodash/merge'
import { getLinks } from '../links'
import { schema } from 'doctypes'
import manifest from 'ducks/client/manifest'
import PushPlugin from 'ducks/mobile/push'
import { checkForRevocation } from 'ducks/client/utils'
import { SentryCozyClientPlugin as SentryPlugin } from 'lib/sentry'

import { SOFTWARE_ID } from 'ducks/mobile/constants'
import { getRedirectUri } from 'ducks/client/mobile/redirect'
import appMetadata from 'ducks/client/appMetadata'

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

const registerPluginsAndHandlers = client => {
  client.registerPlugin(PushPlugin)
  client.registerPlugin(SentryPlugin)
}

export const getClient = () => {
  const manifestOptions = getManifestOptions(manifest)
  const appSlug = manifest.slug

  let client
  const banksOptions = {
    appMetadata,
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
        // TODO: the revocation check via cozy-pouch-link should not be
        // done in the app. We should find a way to have this in a shared
        // repository, possibly in cozy-client or cozy-pouch-link
        onSyncError: async () => {
          checkForRevocation(client)
        }
      }
    })
  }

  client = new CozyClient(
    merge(manifestOptions, banksOptions, { store: false })
  )
  registerPluginsAndHandlers(client)
  return client
}
