import { findMatchingBrand } from './index'

export const findMatchingBrandWithoutTrigger = (label, brands) => {
  const brandsWithoutTrigger = brands.filter(brand => !brand.hasTrigger)

  if (!brandsWithoutTrigger || brandsWithoutTrigger.length === 0) {
    return null
  }

  const matchingBrand = findMatchingBrand(brandsWithoutTrigger, label)

  if (!matchingBrand || matchingBrand.maintenance) {
    return null
  }

  return matchingBrand
}
