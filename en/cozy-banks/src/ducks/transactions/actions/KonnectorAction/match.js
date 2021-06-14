import { hasUrls } from 'ducks/transactions/actions/KonnectorAction/helpers'

import { findMatchingBrandWithoutTrigger } from 'ducks/brandDictionary/selectors'

const match = (transaction, { brands, urls }) => {
  if (!hasUrls(urls)) {
    return false
  }

  const brand = findMatchingBrandWithoutTrigger(transaction.label, brands)
  if (!brand || !brand.konnectorSlug) {
    return false
  }
  return brand
}

export default match
