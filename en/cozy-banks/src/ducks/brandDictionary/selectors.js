import { createSelector } from 'reselect'
import { includes } from 'lodash'

import { getBrands, findMatchingBrand } from './index'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { isKonnectorTrigger, getKonnectorFromTrigger } from 'utils/triggers'
import { querySelector } from 'selectors'

const getInstalledKonnectorsSlugs = triggerCol => {
  if (isCollectionLoading(triggerCol) && !hasBeenLoaded(triggerCol)) {
    return []
  }

  return triggerCol.data
    .filter(isKonnectorTrigger)
    .map(getKonnectorFromTrigger)
    .filter(Boolean)
}

const allBrands = getBrands()

const getInstalledBrandsFromCollection = triggerCol => {
  const installedKonnectorsSlugs = getInstalledKonnectorsSlugs(triggerCol)
  const brands = allBrands.map(brand => ({
    ...brand,
    hasTrigger: includes(installedKonnectorsSlugs, brand.konnectorSlug)
  }))

  return brands
}

export const getBrandsWithoutTrigger = createSelector(
  [brands => brands],
  brands => brands.filter(brand => !brand.hasTrigger)
)

export const findMatchingBrandWithoutTrigger = (label, brands) => {
  const brandsWithoutTrigger = getBrandsWithoutTrigger(brands)

  if (!brandsWithoutTrigger || brandsWithoutTrigger.length === 0) {
    return null
  }

  const matchingBrand = findMatchingBrand(brandsWithoutTrigger, label)

  if (!matchingBrand || matchingBrand.maintenance) {
    return null
  }

  return matchingBrand
}

export const getInstalledBrandsFromQuery = queryName =>
  createSelector(
    [querySelector(queryName)],
    getInstalledBrandsFromCollection
  )

const getBrandsWithoutTriggerSelector = createSelector(
  [getInstalledBrandsFromQuery],
  getBrandsWithoutTrigger
)

export const findMatchingBrandWithoutTriggerSelector = ({ getLabel }) =>
  createSelector(
    [getLabel, getBrandsWithoutTriggerSelector({ queryName: 'triggers' })],
    findMatchingBrandWithoutTrigger
  )
