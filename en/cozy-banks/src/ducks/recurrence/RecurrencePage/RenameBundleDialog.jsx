import React, { useRef } from 'react'

import { useClient } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'
import Field from 'cozy-ui/transpiled/react/Field'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { getLabel } from 'ducks/recurrence/utils'
import { renameRecurrenceManually } from 'ducks/recurrence/api'

const RenameBundleDialog = ({ bundle, dismissAction }) => {
  const client = useClient()
  const { t } = useI18n()
  const renameInputRef = useRef()

  const handleRename = async () => {
    try {
      await renameRecurrenceManually(
        client,
        bundle,
        renameInputRef.current.value
      )
      dismissAction()
      Alerter.success(t('Recurrence.rename.save-success'))
    } catch (e) {
      Alerter.error(t('Recurrence.rename.save-error'))
    }
  }

  return (
    <Dialog
      open={true}
      size="small"
      title={t('Recurrence.rename.modal-title')}
      content={
        <Field
          className="u-m-0"
          labelProps={{ className: 'u-pt-0' }}
          fieldProps={{ defaultValue: getLabel(bundle) }}
          inputRef={renameInputRef}
          label={t('Recurrence.table.label')}
        />
      }
      actions={
        <>
          <Button
            theme="primary"
            onClick={handleRename}
            label={t('Recurrence.rename.save')}
          />
          <Button
            theme="secondary"
            onClick={dismissAction}
            label={t('Recurrence.rename.cancel')}
          />
        </>
      }
    />
  )
}

export default React.memo(RenameBundleDialog)
