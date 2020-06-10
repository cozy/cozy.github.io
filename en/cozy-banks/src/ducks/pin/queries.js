import { SETTINGS_DOCTYPE } from 'doctypes'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import { Q, getDocumentFromState } from 'cozy-client'

const getOne = (doctype, id) => () => {
  const queryDef = Q(doctype)
  queryDef.id = id
  return queryDef
}

export const pinIdentity = {
  doctype: SETTINGS_DOCTYPE,
  id: 'pin'
}

export const pinSetting = {
  query: getOne(pinIdentity.doctype, pinIdentity.id)
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
