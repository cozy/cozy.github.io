import { findMatchingBrand } from 'ducks/brandDictionary'

export function getBrandsWithoutTrigger(brands) {
  return brands.filter(brand => !brand.hasTrigger)
}

export const findMatchingBrandWithoutTrigger = (transaction, brands) => {
  const brandsWithoutTrigger = getBrandsWithoutTrigger(brands)

  if (!brandsWithoutTrigger) {
    return null
  }

  const matchingBrand = findMatchingBrand(
    brandsWithoutTrigger,
    transaction.label
  )

  if (!matchingBrand || matchingBrand.maintenance) {
    return null
  }

  return matchingBrand
}

export const hasUrls = urls => urls['COLLECT'] || urls['HOME']
