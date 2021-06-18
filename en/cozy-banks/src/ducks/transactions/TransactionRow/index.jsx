import React from 'react'

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

export const useTransactionCategoryModal = transaction => {
  const [modalOpened, show, hide] = useSwitch(false)
  const modal = modalOpened ? (
    <TransactionCategoryEditor
      beforeUpdate={hide}
      onCancel={hide}
      transaction={transaction}
    />
  ) : null

  return [show, hide, modal]
}
