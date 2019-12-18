import React from 'react'
import { translate } from 'cozy-ui/react'
import EditionModal from './EditionModal'

export const makeEditionModalFromSpec = spec =>
  translate()(({ initialDoc, onDismiss, onEdit }) => (
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
    />
  ))
