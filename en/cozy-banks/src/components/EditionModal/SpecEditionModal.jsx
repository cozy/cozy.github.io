import React from 'react'
import EditionModal from './EditionModal'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

export const makeEditionModalFromSpec = spec => ({
  initialDoc,
  onDismiss,
  onEdit,
  trackPageName
}) => {
  const { t } = useI18n()
  return (
    <EditionModal
      modalTitle={spec.modalTitle}
      fieldOrder={spec.fieldOrder}
      fieldLabels={spec.fieldLabels}
      fieldSpecs={spec.fieldSpecs}
      initialDoc={initialDoc}
      onEdit={onEdit}
      onDismiss={onDismiss}
      okButtonLabel={() => t('EditionModal.ok')}
      cancelButtonLabel={() => t('EditionModal.cancel')}
      trackPageName={trackPageName}
    />
  )
}
