import React, { useCallback } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import {
  useTrackPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import RawContentDialog from 'components/RawContentDialog'
import TransactionRecurrenceEditor from 'ducks/transactions/TransactionRecurrenceEditor'

const TransactionRecurrenceEditorDialog = ({ transaction, onClose }) => {
  const { t } = useI18n()

  useTrackPage(lastTracked =>
    replaceLastPart(lastTracked, 'depense-affectation_recurrence')
  )

  const handleClose = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  return (
    <RawContentDialog
      size="small"
      open
      onClose={handleClose}
      title={t('Transactions.infos.chooseRecurrence')}
      content={
        <TransactionRecurrenceEditor
          onSelect={x => x}
          beforeUpdate={handleClose}
          onCancel={handleClose}
          transaction={transaction}
        />
      }
    />
  )
}

export default React.memo(TransactionRecurrenceEditorDialog)
