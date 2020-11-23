import find from 'lodash/find'
import some from 'lodash/some'
import brands from 'ducks/brandDictionary/brands'

const getRegexp = brand => {
  return new RegExp(brand.regexp, 'i')
}

export const getBrands = filterFct =>
  filterFct ? brands.filter(filterFct) : brands

export const isMatchingBrand = (brand, label) => getRegexp(brand).test(label)

export const findMatchingBrand = (brands, label) => {
  return find(brands, brand => isMatchingBrand(brand, label))
}

export const matchBrands = (brands, label) => {
  return some(brands, brand => isMatchingBrand(brand, label))
}

export const getBrandsWithInstallationInfo = installedSlugs => {
  const brands = getBrands().map(brand => ({
    ...brand,
    isInstalled: installedSlugs.includes(brand.konnectorSlug)
  }))

  return brands
}

export const getInstalledBrands = installedSlugs => {
  const brands = getBrandsWithInstallationInfo(installedSlugs)

  return brands.filter(brand => brand.isInstalled)
}

export const getNotInstalledBrands = installedSlugs => {
  const brands = getBrandsWithInstallationInfo(installedSlugs)

  return brands.filter(brand => !brand.isInstalled)
}

export default findMatchingBrand
