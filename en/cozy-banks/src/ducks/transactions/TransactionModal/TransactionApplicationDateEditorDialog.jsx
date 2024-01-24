import React, { useCallback } from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import {
  useTrackPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import RawContentDialog from 'components/RawContentDialog'
import TransactionApplicationDateEditor from 'ducks/transactions/TransactionApplicationDateEditor'

const TransactionApplicationDateEditorDialog = ({
  transaction,
  beforeUpdate,
  afterUpdate,
  onClose
}) => {
  const { t } = useI18n()

  useTrackPage(lastTracked =>
    replaceLastPart(lastTracked, `depense-affectation_mois`)
  )

  const handleClose = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  const handleBeforeUpdate = () => {
    beforeUpdate()
    handleClose()
  }

  return (
    <RawContentDialog
      open
      size="small"
      title={t('Transactions.infos.chooseApplicationDate')}
      onClose={handleClose}
      content={
        <TransactionApplicationDateEditor
          beforeUpdate={handleBeforeUpdate}
          afterUpdate={afterUpdate}
          transaction={transaction}
        />
      }
    />
  )
}

export default React.memo(TransactionApplicationDateEditorDialog)
