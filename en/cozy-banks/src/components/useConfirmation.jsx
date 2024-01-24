import React, { useState } from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

const useConfirmation = ({
  onConfirm,
  title,
  description,
  primaryLabel,
  secondaryLabel
}) => {
  const { t } = useI18n()
  const [confirming, setConfirming] = useState(false)

  const handleRequestConfirmation = ev => {
    ev.preventDefault()
    setConfirming(true)
  }

  const handleCancel = ev => {
    ev.preventDefault()
    setConfirming(false)
  }

  const component = confirming ? (
    <ConfirmDialog
      open
      title={title}
      content={description}
      actions={
        <>
          <Button
            theme="secondary"
            onClick={handleCancel}
            label={secondaryLabel || t('Confirmation.cancel')}
          />
          <Button
            theme="danger"
            label={primaryLabel || t('Confirmation.ok')}
            onClick={onConfirm}
          />
        </>
      }
    />
  ) : null

  return {
    requestOpen: handleRequestConfirmation,
    requestCancel: handleCancel,
    component
  }
}

export default useConfirmation
