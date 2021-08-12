import React, { useCallback } from 'react'

import flag from 'cozy-flags'

import TransactionModal from 'ducks/transactions/TransactionModal/TransactionModal'
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
  beforeUpdates,
  afterUpdates,
  onError
}) => {
  const [modalOpened, show, hide] = useSwitch(false)
  const handleBeforeUpdates = useCallback(() => {
    hide()
    beforeUpdates && beforeUpdates()
  }, [beforeUpdates, hide])

  const modal = modalOpened ? (
    <TransactionCategoryEditor
      beforeUpdates={handleBeforeUpdates}
      afterUpdates={afterUpdates}
      transactions={transactions}
      onCancel={hide}
      onError={onError}
    />
  ) : null

  return [show, hide, modal]
}
