import React, { useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import { useClient } from 'cozy-client'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import { countTransactions } from 'components/Tag/helpers'
import { removeTag } from 'ducks/transactions/helpers'
import { trackPage, useTrackPage } from 'ducks/tracking/browser'

const TagDeleteTagModal = ({ tag, transactions, onClose }) => {
  const client = useClient()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [isBusy, toggleBusy] = useReducer(prev => !prev, false)

  useTrackPage('parametres:labels:supprimer-label-popin')

  const handleClick = async () => {
    trackPage('parametres:labels:supprimer-label-confirmation')
    toggleBusy()
    await removeTag(client, tag, transactions)
    navigate(-1) // TODO: find a way to use paths instead
    onClose()
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      title={t('Tag.deleteModal.title')}
      content={t('Tag.deleteModal.content', {
        smart_count: countTransactions(tag)
      })}
      actions={
        <>
          <Button
            variant="secondary"
            label={t('Tag.deleteModal.actions.cancel')}
            onClick={onClose}
          />
          <Button
            color="error"
            label={t('Tag.deleteModal.actions.submit')}
            busy={isBusy}
            onClick={handleClick}
          />
        </>
      }
    />
  )
}

TagDeleteTagModal.propTypes = {
  tag: PropTypes.object.isRequired,
  transactions: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired
}

export default TagDeleteTagModal
