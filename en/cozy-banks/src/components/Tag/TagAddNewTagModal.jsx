import React, { useState, useReducer } from 'react'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import TextField from 'cozy-ui/transpiled/react/MuiCozyTheme/TextField'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/Buttons'

import { TAGS_DOCTYPE } from 'doctypes'
import useDocument from 'components/useDocument'
import { addTag } from 'ducks/transactions/helpers'
import { useEffect } from 'react'

const TagAddNewTagModal = ({ transaction, onClose }) => {
  const client = useClient()
  const { t } = useI18n()
  const [label, setLabel] = useState('')
  const [tagSaved, setTagSaved] = useState(null)
  const [isBusy, toggleBusy] = useReducer(prev => !prev, false)

  const tagFromDoc = useDocument(TAGS_DOCTYPE, tagSaved?._id || ' ')

  const handleChange = ev => {
    setLabel(ev.target.value)
  }

  const handleClick = async () => {
    if (!label) return
    toggleBusy()

    const { data: tag } = await client.save({
      _type: TAGS_DOCTYPE,
      label
    })

    setTagSaved(tag)
  }

  useEffect(() => {
    if (tagSaved) {
      addTag(transaction, tagFromDoc)
      setTagSaved(null)
      onClose()
    }
  }, [transaction, tagFromDoc, tagSaved, onClose])

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('Tag.add-new-tag')}
      content={
        <>
          <TextField
            fullWidth
            margin="normal"
            label={t('Tag.tag-name')}
            variant="outlined"
            inputProps={{ maxLength: 30 }}
            onChange={handleChange}
          ></TextField>
        </>
      }
      actions={
        <>
          <Button
            variant="secondary"
            label={t('Confirmation.cancel')}
            onClick={onClose}
          />
          <Button
            variant="primary"
            label={t('Confirmation.ok')}
            busy={isBusy}
            onClick={handleClick}
          />
        </>
      }
    />
  )
}

export default TagAddNewTagModal
