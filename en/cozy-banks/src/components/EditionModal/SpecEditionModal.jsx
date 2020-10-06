import React from 'react'
import EditionModal from './EditionModal'

export const makeEditionModalFromSpec = spec => ({
  initialDoc,
  onDismiss,
  onEdit,
  trackPageName
}) => (
  <EditionModal
    modalTitle={spec.modalTitle}
    fieldOrder={spec.fieldOrder}
    fieldLabels={spec.fieldLabels}
    fieldSpecs={spec.fieldSpecs}
    initialDoc={initialDoc}
    onEdit={onEdit}
    onDismiss={onDismiss}
    okButtonLabel={() => 'OK'}
    cancelButtonLabel={() => 'Cancel'}
    trackPageName={trackPageName}
  />
)
