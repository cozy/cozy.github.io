import React from 'react'
import { useClient } from 'cozy-client'
import { updateTransactionCategory } from 'ducks/transactions/helpers'
import { getCategoryId } from 'ducks/categories/helpers'
import CategoryChoice from 'ducks/categories/CategoryChoice'

/**
 * Edits a transaction's category through CategoryChoice
 */
const TransactionCategoryEditor = props => {
  const client = useClient()
  const { transaction, beforeUpdate, afterUpdate, onCancel, modal } = props

  const handleSelect = async category => {
    if (beforeUpdate) {
      await beforeUpdate()
    }
    const newTransaction = await updateTransactionCategory(
      client,
      transaction,
      category
    )
    if (afterUpdate) {
      await afterUpdate(newTransaction)
    }
  }

  const handleCancel = async () => {
    await onCancel()
  }

  return (
    <CategoryChoice
      modal={modal}
      categoryId={getCategoryId(transaction)}
      onSelect={handleSelect}
      onCancel={handleCancel}
    />
  )
}

TransactionCategoryEditor.defaultProps = {
  modal: false
}

export default TransactionCategoryEditor
