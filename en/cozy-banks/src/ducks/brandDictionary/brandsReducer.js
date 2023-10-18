import includes from 'lodash/includes'

import { Registry } from 'cozy-client'
import { triggers as triggerModel } from 'cozy-client/dist/models/trigger'

import { buildTriggerWithoutCurrentStateQuery } from 'src/doctypes'
import brands from 'ducks/brandDictionary/brands'

const FETCH_BRANDS = 'FETCH_BRANDS'

const makeBrand = (
  registryKonnector,
  allJSONBrands,
  installedKonnectorsSlugs
) => {
  const match = allJSONBrands.find(
    brand => brand.konnectorSlug === registryKonnector.slug
  )
  const name =
    registryKonnector.latest_version?.manifest?.name ||
    match?.name ||
    registryKonnector.slug

  const regexp =
    registryKonnector.latest_version?.manifest?.banksTransactionRegExp ||
    match?.regexp ||
    ''

  return {
    name,
    konnectorSlug: registryKonnector.slug,
    regexp,
    ...(match?.health && { health: match.health }),
    ...(match?.contact && { contact: match.contact }),
    maintenance: !!registryKonnector.maintenance_activated,
    hasTrigger: includes(installedKonnectorsSlugs, registryKonnector.slug)
  }
}

export const makeBrands = async (client, dispatch, inService) => {
  const registry = new Registry({ client })
  const allRegistryKonnectors = await registry.fetchApps({
    limit: 1000,
    channel: 'stable',
    type: 'konnector'
  })

  const triggerWithoutCurrentStateQuery = buildTriggerWithoutCurrentStateQuery()
  const triggers = await client.queryAll(
    triggerWithoutCurrentStateQuery.definition,
    triggerWithoutCurrentStateQuery.options
  )

  const { getKonnector, isKonnectorWorker } = triggerModel
  const installedKonnectorsSlugs = triggers
    ? triggers.filter(isKonnectorWorker).map(getKonnector).filter(Boolean)
    : []

  const allBrands = allRegistryKonnectors.reduce(
    (allBrands, data) => [
      ...allBrands,
      makeBrand(data, brands, installedKonnectorsSlugs)
    ],
    []
  )

  if (inService) {
    return allBrands
  }
  return dispatch({ type: FETCH_BRANDS, brands: allBrands })
}

const brandsReducer = (state = [], action) => {
  switch (action.type) {
    case FETCH_BRANDS:
      return action.brands
    default:
      return state
  }
}

export default brandsReducer
