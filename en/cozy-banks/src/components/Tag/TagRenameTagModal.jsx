import React, { useState, useReducer } from 'react'
import PropTypes from 'prop-types'

import { useClient } from 'cozy-client'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import TextField from 'cozy-ui/transpiled/react/TextField'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/Buttons'

import { trackPage, useTrackPage } from 'ducks/tracking/browser'

const TagRenameTagModal = ({ tag, onClose, withLabel }) => {
  const client = useClient()
  const { t } = useI18n()
  const [label, setLabel] = useState(tag.label)
  const [isBusy, toggleBusy] = useReducer(prev => !prev, false)

  useTrackPage('parametres:labels:renommer-label-saisie')

  const handleClick = async () => {
    trackPage('parametres:labels:renommer-label-confirmation')
    toggleBusy()
    await client.save({
      ...tag,
      label
    })
    onClose()
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('Tag.renameModal.title')}
      content={
        <>
          <TextField
            fullWidth
            margin="normal"
            {...(withLabel && { label: t('Tag.renameModal.label') })}
            defaultValue={tag.label}
            autoFocus
            variant="outlined"
            inputProps={{ maxLength: 30 }}
            onChange={event => setLabel(event.target.value)}
          />
        </>
      }
      actions={
        <>
          <Button
            variant="secondary"
            label={t('Tag.renameModal.actions.cancel')}
            onClick={onClose}
          />
          <Button
            label={t('Tag.renameModal.actions.submit')}
            busy={isBusy}
            disabled={label.length === 0}
            onClick={handleClick}
          />
        </>
      }
    />
  )
}

TagRenameTagModal.defaultProps = {
  withLabel: true
}

TagRenameTagModal.propTypes = {
  tag: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  withLabel: PropTypes.bool
}

export default TagRenameTagModal
