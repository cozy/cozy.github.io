import fromPairs from 'lodash/fromPairs'

import { Q } from 'cozy-client'
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

export const getWarmupQueries = () => {
  const warmupQueries = [
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['date']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, [APPLICATION_DATE]),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account', 'date']),
    makeWarmupQueryOptions(TRANSACTION_DOCTYPE, ['account', APPLICATION_DATE])
  ]
  return warmupQueries
}
