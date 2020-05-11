/**
 * This helper is kept out of transactions/helpers to avoid a circular dependency
 * between ducks/transactions/helpers and ducks/categories/helpers
 */

import flag from 'cozy-flags'
import { BankTransaction } from 'cozy-doctypes'

/**
 * Return the category id of the transaction
 *
 * @param {Object} transaction
 * @return {String|null} A category id or null if the transaction has not been categorized yet
 */
const getCategoryId = transaction => {
  const localModelOverride = flag('local-model-override')

  return BankTransaction.getCategoryId(transaction, { localModelOverride })
}

export default getCategoryId
