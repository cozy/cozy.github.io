import React, { useCallback } from 'react'

import flag from 'cozy-flags'

import TransactionModal from 'ducks/transactions/TransactionModal'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'
import useSwitch from 'hooks/useSwitch'

export const showTransactionActions = !flag(
  'banks.transaction-actions.deactivated'
)

export const useTransactionModal = transaction => {
  const [modalOpened, show, hide] = useSwitch(false)
  const modal = modalOpened ? (
    <TransactionModal requestClose={hide} transactionId={transaction._id} />
  ) : null

  return [show, hide, modal]
}

export const useTransactionCategoryModal = ({
  transactions,
  beforeUpdate,
  afterUpdates
}) => {
  const [modalOpened, show, hide] = useSwitch(false)
  const handleBeforeUpdate = useCallback(() => {
    hide()
    beforeUpdate && beforeUpdate()
  }, [beforeUpdate, hide])

  const modal = modalOpened ? (
    <TransactionCategoryEditor
      beforeUpdate={handleBeforeUpdate}
      afterUpdates={afterUpdates}
      transactions={transactions}
      onCancel={hide}
    />
  ) : null

  return [show, hide, modal]
}
