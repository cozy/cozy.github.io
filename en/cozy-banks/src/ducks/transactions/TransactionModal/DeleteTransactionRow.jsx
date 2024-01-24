import React, { useState } from 'react'

import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import {
  removeTransaction,
  getTagsRelationshipByTransaction
} from 'ducks/transactions/helpers'
import useDocuments from 'components/useDocuments'
import { TAGS_DOCTYPE } from 'doctypes'

const DeleteTransactionRow = ({ transaction }) => {
  const { t } = useI18n()
  const client = useClient()
  const [showingDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const tagsRelationship = getTagsRelationshipByTransaction(transaction)

  const transactionTagsIds = tagsRelationship
    ? tagsRelationship.map(t => t._id)
    : []
  const transactionTagsWithTransactions = useDocuments(
    TAGS_DOCTYPE,
    transactionTagsIds
  )

  const handleRequestDeleteTransaction = () => {
    setShowDeleteConfirmation(true)
  }

  const handleCancelDeleteTransactions = () => {
    setShowDeleteConfirmation(false)
  }

  const handleConfirmDeleteTransaction = async () => {
    try {
      setDeleting(true)
      await removeTransaction(
        client,
        transaction,
        transactionTagsWithTransactions
      )

      Alerter.success(
        t('Transactions.infos.delete-transaction.deleting-success')
      )
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error while deleting transaction')
      // eslint-disable-next-line no-console
      console.error(e)
      Alerter.error(t('Transactions.infos.delete-transaction.deleting-error'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <ListItem button onClick={handleRequestDeleteTransaction}>
        <ListItemIcon>
          <Icon className="u-error" icon={TrashIcon} />
        </ListItemIcon>
        <ListItemText
          primary={
            <span className="u-error">
              {t('Transactions.infos.delete-transaction.row-label')}
            </span>
          }
        />
      </ListItem>
      {showingDeleteConfirmation ? (
        <ConfirmDialog
          open
          title={t('Transactions.infos.delete-transaction.confirm-modal.title')}
          content={t(
            'Transactions.infos.delete-transaction.confirm-modal.content'
          )}
          onClose={handleCancelDeleteTransactions}
          actions={
            <>
              <Button
                theme="secondary"
                onClick={handleCancelDeleteTransactions}
                label={t(
                  'Transactions.infos.delete-transaction.confirm-modal.cancel'
                )}
                disabled={deleting}
              />
              <Button
                theme="danger"
                onClick={handleConfirmDeleteTransaction}
                label={t(
                  'Transactions.infos.delete-transaction.confirm-modal.confirm'
                )}
                disabled={deleting}
                busy={deleting}
              />
            </>
          }
        />
      ) : null}
    </>
  )
}

export default React.memo(DeleteTransactionRow)
