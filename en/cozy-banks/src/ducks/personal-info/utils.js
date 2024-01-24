import { Q } from 'cozy-client'
import merge from 'lodash/merge'
import get from 'lodash/get'

import { IDENTITIES_DOCTYPE } from 'doctypes'

export const defaultIdentityIdentifier = 'regulatory-info'

export const identitiesQuery = selector => {
  return Q(IDENTITIES_DOCTYPE)
    .where(selector)
    .indexFields(
      [
        selector['cozyMetadata.createdByApp']
          ? 'cozyMetadata.createdByApp'
          : null,
        selector.identifier ? 'identifier' : null
      ].filter(Boolean)
    )
}

export const requiredFieldChecks = {
  'contact.birthcity': x => x,
  'contact.birthcountry': x => x,
  'contact.nationalities': x => x && x.length > 0
}

/**
 * Runs on an identity to check if it is sufficiently filled for a transfer
 */
export const isIdentitySufficientlyFilled = identity => {
  const fields = Object.entries(requiredFieldChecks).filter(
    ([fieldName, fieldCheck]) => fieldCheck(get(identity, fieldName))
  )
  return fields.length == Object.keys(requiredFieldChecks).length
}

export const getDefaultIdentitySelector = client => ({
  'cozyMetadata.createdByApp': client.appMetadata.slug,
  identifier: defaultIdentityIdentifier
})

export const loadIdentity = async (client, selector) => {
  try {
    const { data: identities } = await client.query(identitiesQuery(selector))
    return identities.length > 0 ? identities[0] : null
  } catch {
    return null
  }
}

export const isCurrentAppIdentity = client => {
  const currentAppSlug = client.appMetadata.slug
  return identity =>
    get(identity, 'cozyMetadata.createdByApp') == currentAppSlug
}

/** Several several identities from several selectors */
export const loadIdentities = async (client, selectors) => {
  const identities = await Promise.all(
    selectors.map(selector => loadIdentity(client, selector))
  )
  return identities
}

/**
 * Saves personal info into app io.cozy.identities
 */
export const saveIdentity = async (client, identity, contactAttrs) => {
  const attributes = {
    _type: IDENTITIES_DOCTYPE,
    contact: merge({}, identity.contact, contactAttrs),
    identifier: defaultIdentityIdentifier
  }
  const updatedIdentity = {
    ...identity,
    ...attributes
  }
  const { data: ret } = await client.save(updatedIdentity)
  return ret
}
