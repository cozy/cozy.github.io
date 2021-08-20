/* global __POUCH__ */

import fromPairs from 'lodash/fromPairs'
import { StackLink, Q } from 'cozy-client'
import { offlineDoctypes } from 'doctypes'
import { isMobileApp, isIOSApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import { TRANSACTION_DOCTYPE } from 'doctypes'

import { APPLICATION_DATE } from 'ducks/transactions/constants'

const activatePouch = __POUCH__ && !flag('banks.pouch.disabled')

let PouchLink

const makeWarmupQueryOptions = (doctype, indexedFields) => {
  return {
    definition: () => {
      const qdef = Q(doctype)
        .where(
          fromPairs(indexedFields.map(fieldName => [fieldName, { $gt: null }]))
        )
        .indexFields(indexedFields)
      return qdef
    },
    options: {
      as: `${doctype}-by-${indexedFields.join('-')}`
    }
  }
}

const pouchLinkOptions = {
  doctypes: offlineDoctypes,
  doctypesReplicationOptions: {
    [TRANSACTION_DOCTYPE]: {
      warmupQueries: [
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date']),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, [APPLICATION_DATE]),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account']),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date', 'account']),
        makeWarmupQueryOptions(TRANSACTION_DOCTYPE, [
          APPLICATION_DATE,
          'account'
        ])
      ]
    }
  },
  initialSync: true
}

if (activatePouch) {
  PouchLink = require('cozy-pouch-link').default

  if (isMobileApp() && isIOSApp()) {
    pouchLinkOptions.pouch = {
      plugins: [require('pouchdb-adapter-cordova-sqlite')],
      options: {
        adapter: 'cordova-sqlite',
        location: 'default'
      }
    }
  }
}

let links = null
export const getLinks = (options = {}) => {
  if (links) {
    return links
  }

  const stackLink = new StackLink()
  links = [stackLink]

  if (activatePouch) {
    const pouchLink = new PouchLink({
      ...pouchLinkOptions,
      ...options.pouchLink
    })
    links = [pouchLink, ...links]
  }

  return links
}
