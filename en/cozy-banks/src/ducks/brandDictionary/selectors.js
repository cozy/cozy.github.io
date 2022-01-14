import { createSelector } from 'reselect'
import includes from 'lodash/includes'

import { isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { getBrands, findMatchingBrand } from './index'
import { trigger as triggerLibs } from 'cozy-client/dist/models'
import { querySelector } from 'selectors'

const { getKonnector, isKonnectorWorker } = triggerLibs.triggers

const getInstalledKonnectorsSlugs = triggerCol => {
  if (isQueryLoading(triggerCol) && !hasQueryBeenLoaded(triggerCol)) {
    return []
  }

  return triggerCol.data
    .filter(isKonnectorWorker)
    .map(getKonnector)
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
  createSelector([querySelector(queryName)], getInstalledBrandsFromCollection)

const getBrandsWithoutTriggerSelector = createSelector(
  [getInstalledBrandsFromQuery],
  getBrandsWithoutTrigger
)

export const findMatchingBrandWithoutTriggerSelector = ({ getLabel }) =>
  createSelector(
    [getLabel, getBrandsWithoutTriggerSelector({ queryName: 'triggers' })],
    findMatchingBrandWithoutTrigger
  )
