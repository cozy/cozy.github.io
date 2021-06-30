import React, { useMemo, useCallback } from 'react'
import { useClient } from 'cozy-client'
import {
  updateTransactionCategory,
  getCategoryId
} from 'ducks/transactions/helpers'
import CategoryChoice from 'ducks/categories/CategoryChoice'

/**
 * Edits a transaction's category through CategoryChoice
 */
const TransactionCategoryEditor = ({
  transactions,
  beforeUpdate,
  afterUpdate,
  afterUpdates,
  onCancel
}) => {
  const client = useClient()
  const categoryId = useMemo(() => getCategoryId(transactions[0]), [
    transactions
  ])

  const handleUpdate = useCallback(
    async (transaction, category) => {
      const newTransaction = await updateTransactionCategory(
        client,
        transaction,
        category
      )

      if (afterUpdate) {
        await afterUpdate(newTransaction)
      }
    },
    [afterUpdate, client]
  )

  const handleSelect = useCallback(
    async category => {
      if (beforeUpdate) {
        await beforeUpdate()
      }

      const promises = transactions.map(transaction =>
        handleUpdate(transaction, category)
      )

      await Promise.all(promises)

      if (afterUpdates) {
        afterUpdates()
      }
    },
    [afterUpdates, beforeUpdate, handleUpdate, transactions]
  )

  const handleCancel = useCallback(async () => {
    await onCancel()
  }, [onCancel])

  return (
    <CategoryChoice
      modal={true}
      categoryId={categoryId}
      onSelect={handleSelect}
      onCancel={handleCancel}
    />
  )
}

TransactionCategoryEditor.defaultProps = {
  modal: false
}

export default React.memo(TransactionCategoryEditor)
