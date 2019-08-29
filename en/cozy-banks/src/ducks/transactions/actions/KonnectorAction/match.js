import {
  hasUrls,
  findMatchingBrandWithoutTrigger
} from 'ducks/transactions/actions/KonnectorAction/helpers'

const match = (transaction, { brands, urls }) => {
  if (!hasUrls(urls)) {
    return false
  }

  const matchingBrand = findMatchingBrandWithoutTrigger(transaction, brands)

  return matchingBrand
}

export default match
