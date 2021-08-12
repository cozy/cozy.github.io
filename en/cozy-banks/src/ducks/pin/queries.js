import { SETTINGS_DOCTYPE } from 'doctypes'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import CozyClient, { Q, getDocumentFromState } from 'cozy-client'

export const pinIdentity = {
  doctype: SETTINGS_DOCTYPE,
  id: 'pin'
}

export const pinSetting = {
  query: Q(pinIdentity.doctype).getById(pinIdentity.id),
  fetchPolicy: CozyClient.fetchPolicies.olderThan(30 * 1000),
  as: 'io.cozy.bank.settings/pin'
}

/**
 * Gives access to documents inside cozy-client's store
 * Useful when you know the necessary data has been fetched
 */
export const withCached = identityMapping => {
  return connect(state => {
    return mapValues(identityMapping, identity => {
      return getDocumentFromState(state.cozy, identity.doctype, identity.id)
    })
  })
}
