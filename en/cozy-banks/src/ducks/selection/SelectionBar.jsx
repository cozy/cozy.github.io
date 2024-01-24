import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import UISelectionBar from 'cozy-ui/transpiled/react/SelectionBar'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { useSelectionContext } from 'ducks/context/SelectionContext'
import { useSelectionBarActions } from 'ducks/selection/helpers'
import { useTransactionCategoryModal } from 'ducks/transactions/TransactionRow'

const SelectionBar = ({ transactions }) => {
  const { isSelectionModeActive, selected, emptyAndDeactivateSelection } =
    useSelectionContext()

  const { t } = useI18n()

  const beforeUpdates = useCallback(() => {
    emptyAndDeactivateSelection()
  }, [emptyAndDeactivateSelection])

  const afterUpdates = () => {
    Alerter.success(
      t('Categorization.success', {
        smart_count: selected.length
      })
    )
  }

  const onError = () => {
    Alerter.error(t('Categorization.error'))
  }

  const [showTransactionCategoryModal, , transactionCategoryModal] =
    useTransactionCategoryModal({
      transactions: selected,
      beforeUpdates,
      afterUpdates,
      onError
    })

  const actions = useSelectionBarActions({
    items: transactions,
    showTransactionCategoryModal
  })

  return (
    <>
      {isSelectionModeActive && (
        <UISelectionBar
          actions={actions}
          selected={selected}
          hideSelectionBar={emptyAndDeactivateSelection}
        />
      )}
      {transactionCategoryModal}
    </>
  )
}

SelectionBar.propTypes = {
  transactions: PropTypes.array
}

export default React.memo(SelectionBar)
