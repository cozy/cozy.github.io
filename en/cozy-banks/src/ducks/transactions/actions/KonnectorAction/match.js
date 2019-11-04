import { hasUrls } from 'ducks/transactions/actions/KonnectorAction/helpers'

import { findMatchingBrandWithoutTrigger } from 'ducks/brandDictionary/selectors'

const match = (transaction, { brands, urls }) => {
  if (!hasUrls(urls)) {
    return false
  }

  return findMatchingBrandWithoutTrigger(transaction.label, brands)
}

export default match
