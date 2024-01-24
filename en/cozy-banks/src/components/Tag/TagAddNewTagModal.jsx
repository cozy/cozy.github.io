import React, { useState, useReducer } from 'react'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import TextField from 'cozy-ui/transpiled/react/TextField'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/Buttons'

import { TAGS_DOCTYPE } from 'doctypes'
import { trackPage, useTrackPage } from 'ducks/tracking/browser'

const labelMaxLength = 30

const TagAddNewTagModal = ({ onClick, onClose, withLabel }) => {
  const client = useClient()
  const { t } = useI18n()
  const location = useLocation()
  const [label, setLabel] = useState('')
  const [isBusy, toggleBusy] = useReducer(prev => !prev, false)
  const inSettings = location.pathname.startsWith('/settings')

  useTrackPage(
    inSettings
      ? 'parametres:labels:creation-label-saisie'
      : 'mon_compte:depense:creation-label-saisie'
  )

  const handleChange = ev => {
    const currentValue = ev.target.value
    if (currentValue.match(/^\S.*/)) {
      setLabel(currentValue.substring(0, labelMaxLength))
    } else setLabel('')
  }

  const handleClick = async () => {
    trackPage(
      inSettings
        ? 'parametres:labels:creation-label-confirmation'
        : 'mon_compte:depense:creation-label-confirmation'
    )
    toggleBusy()

    const { data: tag } = await client.save({
      _type: TAGS_DOCTYPE,
      label: label.trim()
    })

    if (onClick) onClick(tag)
    onClose()
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('Tag.add-new-tag')}
      content={
        <TextField
          fullWidth
          value={label}
          margin="normal"
          {...(withLabel && { label: t('Tag.tag-name') })}
          variant="outlined"
          inputProps={{
            maxLength: labelMaxLength,
            'data-testid': 'TagAddNewTagModal-TextField'
          }}
          autoFocus
          onChange={handleChange}
        />
      }
      actions={
        <>
          <Button
            fullWidth
            variant="secondary"
            label={t('Tag.addModal.actions.cancel')}
            onClick={onClose}
          />
          <Button
            fullWidth
            label={t('Tag.addModal.actions.submit')}
            busy={isBusy}
            disabled={label.length === 0}
            onClick={handleClick}
            data-testid="TagAddNewTagModal-Button-submit"
          />
        </>
      }
    />
  )
}

TagAddNewTagModal.defaultProps = {
  withLabel: true
}

TagAddNewTagModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  withLabel: PropTypes.bool
}

export default TagAddNewTagModal
