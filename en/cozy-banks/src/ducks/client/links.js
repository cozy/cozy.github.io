/* global __POUCH__ */

import { StackLink } from 'cozy-client'
import flag from 'cozy-flags'

import { offlineDoctypes, TRANSACTION_DOCTYPE } from 'doctypes'
import { getWarmupQueries } from './linksHelpers'

export const isActivatePouch = () => __POUCH__ && !flag('banks.pouch.disabled')
let links = null

export const getLinks = async (options = {}) => {
  if (links) {
    return links
  }

  const stackLink = new StackLink()

  links = [stackLink]

  if (isActivatePouch()) {
    const pouchLinkOptions = {
      doctypes: offlineDoctypes,
      doctypesReplicationOptions: {
        [TRANSACTION_DOCTYPE]: {
          warmupQueries: getWarmupQueries()
        }
      },
      initialSync: true
    }

    const PouchLink = require('cozy-pouch-link').default

    const pouchLink = new PouchLink({
      ...pouchLinkOptions,
      ...options.pouchLink
    })

    links = [pouchLink, ...links]
  }

  return links
}
