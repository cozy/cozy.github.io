import React, { useCallback, useMemo } from 'react'

import UISelectionBar from 'cozy-ui/transpiled/react/SelectionBar'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import { useSelectionContext } from 'ducks/context/SelectionContext'
import { makeSelectionBarActions } from 'ducks/selection/helpers'
import { useTransactionCategoryModal } from 'ducks/transactions/TransactionRow'

const SelectionBar = () => {
  const {
    isSelectionModeEnabled,
    isSelectionModeActive,
    selected,
    emptySelection
  } = useSelectionContext()

  const { t } = useI18n()

  const beforeUpdate = useCallback(() => {
    emptySelection()
  }, [emptySelection])

  const afterUpdates = () => {
    Alerter.success(
      t('Categorization.success', {
        smart_count: selected.length
      })
    )
  }

  const [
    showTransactionCategoryModal,
    ,
    transactionCategoryModal
  ] = useTransactionCategoryModal({
    transactions: selected,
    beforeUpdate,
    afterUpdates
  })

  const actions = useMemo(
    () => makeSelectionBarActions(showTransactionCategoryModal),
    [showTransactionCategoryModal]
  )

  if (!isSelectionModeEnabled) return null
  return (
    <>
      {isSelectionModeActive && (
        <UISelectionBar
          actions={actions}
          selected={selected}
          hideSelectionBar={emptySelection}
        />
      )}
      {transactionCategoryModal}
    </>
  )
}

export default SelectionBar
