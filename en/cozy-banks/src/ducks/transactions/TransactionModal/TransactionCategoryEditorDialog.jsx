import React, { useCallback } from 'react'

import {
  trackEvent,
  useTrackPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'

const TransactionCategoryEditorDialog = ({ transaction, onClose }) => {
  const onAfterUpdates = transactions => {
    trackEvent({
      name: getCategoryName(transactions[0].manualCategoryId)
    })
  }

  useTrackPage(lastTracked => replaceLastPart(lastTracked, 'depense-categorie'))

  const handlePop = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  return (
    <TransactionCategoryEditor
      beforeUpdates={handlePop}
      afterUpdates={onAfterUpdates}
      onCancel={handlePop}
      transactions={[transaction]}
    />
  )
}

export default React.memo(TransactionCategoryEditorDialog)
