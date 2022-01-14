import React, { useMemo, useCallback } from 'react'
import { Q, useClient } from 'cozy-client'
import {
  setTransactionCategory,
  getCategoryId
} from 'ducks/transactions/helpers'
import CategoryChoice from 'ducks/categories/CategoryChoice'
import { TRANSACTION_DOCTYPE } from 'doctypes'

/**
 * Edits a transaction's category through CategoryChoice
 */
const TransactionCategoryEditor = ({
  transactions,
  beforeUpdates,
  afterUpdates,
  onError,
  onCancel
}) => {
  const client = useClient()
  const categoryId = useMemo(
    () => getCategoryId(transactions[0]),
    [transactions]
  )

  const handleSelectCategory = useCallback(
    async category => {
      if (beforeUpdates) {
        await beforeUpdates()
      }

      const newTransactions = transactions.map(transaction =>
        setTransactionCategory(transaction, category)
      )

      try {
        await client.saveAll(newTransactions)
      } catch (e) {
        const qdef = Q(TRANSACTION_DOCTYPE).getByIds(
          newTransactions.map(t => t._id)
        )

        // eslint-disable-next-line no-console
        console.error(
          'Error while batch saving, requerying operations to mitigate conflicts in the future',
          e
        )
        client.query(qdef)
        if (onError) {
          onError(e)
        }
        return
      }

      if (afterUpdates) {
        afterUpdates(newTransactions)
      }
    },
    [afterUpdates, beforeUpdates, client, onError, transactions]
  )

  const handleCancel = useCallback(async () => {
    await onCancel()
  }, [onCancel])

  return (
    <CategoryChoice
      modal={true}
      categoryId={categoryId}
      onSelect={handleSelectCategory}
      onCancel={handleCancel}
    />
  )
}

TransactionCategoryEditor.defaultProps = {
  modal: false
}

export default React.memo(TransactionCategoryEditor)
