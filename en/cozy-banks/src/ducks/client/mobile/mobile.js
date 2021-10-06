/* global __APP_VERSION__ */
import merge from 'lodash/merge'

import CozyClient from 'cozy-client'

import { schema } from 'doctypes'
import { SOFTWARE_ID } from 'ducks/mobile/constants'
import { getLinks } from 'ducks/client/links'
import manifest from 'ducks/client/manifest'
import { checkForRevocation } from 'ducks/client/utils'
import appMetadata from 'ducks/client/appMetadata'
import { getRedirectUri } from 'ducks/client/mobile/redirect'
import {
  registerPluginsAndHandlers,
  getManifestOptions
} from 'ducks/client/mobile/helpers'

export const getClient = async () => {
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
    links: await getLinks({
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
