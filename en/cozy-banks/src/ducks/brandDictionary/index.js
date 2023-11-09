import find from 'lodash/find'
import some from 'lodash/some'

import getClient from 'selectors/getClient'

const getRegexp = brand => {
  return new RegExp(brand.regexp, 'i')
}

export const getBrands = (filterFct, client) => {
  const selfClient = client || getClient()
  const allBrands = selfClient.store.getState().brands
  return filterFct ? allBrands.filter(filterFct) : allBrands
}

export const isMatchingBrand = (brand, label) => {
  return brand.regexp ? getRegexp(brand).test(label) : false
}

export const findMatchingBrand = (brands, label) => {
  return find(brands, brand => isMatchingBrand(brand, label))
}

export const matchBrands = (brands, label) => {
  return some(brands, brand => isMatchingBrand(brand, label))
}

export const getBrandsWithInstallationInfo = (installedSlugs, brands) => {
  const brandsWithInfo = brands.map(brand => ({
    ...brand,
    isInstalled: installedSlugs.includes(brand.konnectorSlug)
  }))

  return brandsWithInfo
}

export const getNotInstalledBrands = (installedSlugs, brands) => {
  const brandsWithInstallationInfo = getBrandsWithInstallationInfo(
    installedSlugs,
    brands
  )

  return brandsWithInstallationInfo.filter(brand => !brand.isInstalled)
}

export default findMatchingBrand
