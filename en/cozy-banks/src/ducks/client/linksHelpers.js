import fromPairs from 'lodash/fromPairs'
import localforage from 'localforage'

import PouchLink from 'cozy-pouch-link'
import { Q } from 'cozy-client'
import { isMobileApp, isIOSApp } from 'cozy-device-helper'
import { TRANSACTION_DOCTYPE } from 'doctypes'

import { APPLICATION_DATE } from 'ducks/transactions/constants'

export const makeWarmupQueryOptions = (doctype, indexedFields) => {
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

export const getAdapterPlugin = adapterName => {
  if (adapterName === 'cordova-sqlite') {
    return require('pouchdb-adapter-cordova-sqlite')
  }
  if (adapterName === 'idb') {
    return require('pouchdb-adapter-idb')
  }
  return require('pouchdb-adapter-indexeddb').default
}

export const getOldAdapterName = () => {
  return isMobileApp() && isIOSApp() ? 'cordova-sqlite' : 'idb'
}

export const fetchCredentials = async () => {
  return await localforage.getItem('credentials')
}

export const isAuthenticated = async () => {
  const credentials = await fetchCredentials()
  return Boolean(credentials)
}

export const shouldMigrateAdapter = async () => {
  const isAuthentified = await isAuthenticated()
  return isAuthentified && PouchLink.getPouchAdapterName() !== 'indexeddb'
}

export const pickAdapter = async () => {
  const isAuthentified = await isAuthenticated()
  if (!isAuthentified) return 'indexeddb' // user not authentified, so no data to migrate

  return PouchLink.getPouchAdapterName() === 'indexeddb'
    ? PouchLink.getPouchAdapterName()
    : getOldAdapterName()
}

export const getWarmupQueries = () => {
  const warmupQueries = [
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, [APPLICATION_DATE]),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date', 'account']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, [APPLICATION_DATE, 'account'])
  ]

  if (isIOSApp()) {
    warmupQueries.push(
      makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date', 'operations'])
    )
  }

  return warmupQueries
}
