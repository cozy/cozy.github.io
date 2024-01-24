import React, { useState } from 'react'

import { TRANSACTION_DOCTYPE } from 'doctypes'
import flag from 'cozy-flags'
import { useClient } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import RestoreIcon from 'cozy-ui/transpiled/react/Icons/Restore'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import IconButton from 'cozy-ui/transpiled/react/IconButton'

import ListItemArrow from 'components/ListItemArrow'
import iconCalendar from 'components/IconCalendar'
import useDocument from 'components/useDocument'
import iconCredit from 'components/IconCredit'
import { trackEvent } from 'ducks/tracking/browser'
import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'
import {
  getCategoryId,
  updateApplicationDate,
  getDate,
  getApplicationDate
} from 'ducks/transactions/helpers'
import TransactionActions from 'ducks/transactions/TransactionActions'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import { showAlertAfterApplicationDateUpdate } from 'ducks/transactions/TransactionModal/helpers'
import TransactionLabel from 'ducks/transactions/TransactionModal/TransactionLabel'
import TransactionInfos from 'ducks/transactions/TransactionModal/TransactionInfos'
import RecurrenceRow from 'ducks/transactions/TransactionModal/RecurrenceRow'
import DeleteTransactionRow from 'ducks/transactions/TransactionModal/DeleteTransactionRow'
import TransactionCategoryEditorDialog from 'ducks/transactions/TransactionModal/TransactionCategoryEditorDialog'
import TransactionApplicationDateEditorDialog from 'ducks/transactions/TransactionModal/TransactionApplicationDateEditorDialog'
import TransactionRecurrenceEditorDialog from 'ducks/transactions/TransactionModal/TransactionRecurrenceEditorDialog'
import TagListItem from 'components/Tag/TagListItem'

import styles from 'ducks/transactions/TransactionModal/TransactionModal.styl'

/**
 * Shows information of the transaction
 *
 * Can edit
 * - the recurrence
 * - the category of transaction
 * - the date
 *
 * Shows also actions that are possible to do on a transaction (depends
 * on the transaction).
 */
const TransactionModalInfoContent = props => {
  const { t, f } = useI18n()
  const client = useClient()
  const { transactionId, requestClose } = props
  const transaction = useDocument(TRANSACTION_DOCTYPE, transactionId)
  const typeIcon = (
    <Icon
      icon={iconCredit}
      width={16}
      className={`${
        transaction.amount < 0 ? styles['TransactionModalRowIcon-reversed'] : ''
      } u-mt-1-half`}
    />
  )

  const categoryId = getCategoryId(transaction)
  const account = transaction.account.data

  const [selectedRow, setSelectedRow] = useState(null)

  const [applicationDateBusy, setApplicationDateBusy] = useState(false)

  const handleAfterUpdateApplicationDate = updatedTransaction => {
    setApplicationDateBusy(false)
    showAlertAfterApplicationDateUpdate(updatedTransaction, t, f)
    const date =
      getApplicationDate(updatedTransaction) || getDate(updatedTransaction)
    trackEvent({
      name: date
    })
  }

  const handleResetApplicationDate = async ev => {
    ev.preventDefault()
    ev.stopPropagation()
    try {
      setApplicationDateBusy(true)
      const newTransaction = await updateApplicationDate(
        client,
        transaction,
        null
      )
      showAlertAfterApplicationDateUpdate(newTransaction, t, f)
    } finally {
      setApplicationDateBusy(false)
    }
  }

  const shouldShowRestoreApplicationDateIcon =
    getApplicationDate(transaction) && !applicationDateBusy

  const handleSelectRow = row => {
    setSelectedRow(row)
  }
  const handleCloseChildModal = () => {
    setSelectedRow(null)
  }

  return (
    <List>
      <ListItem divider button={false} alignItems="flex-start">
        <ListItemIcon>{typeIcon}</ListItemIcon>
        <ListItemText>
          <TransactionLabel transaction={transaction} />
          <TransactionInfos
            infos={[
              {
                label: t('Transactions.infos.account'),
                value: getAccountLabel(account, t)
              },
              {
                label: t('Transactions.infos.institution'),
                value: getAccountInstitutionLabel(account)
              },
              {
                label: t('Transactions.infos.originalBankLabel'),
                value:
                  flag('originalBankLabel') && transaction.originalBankLabel
              },
              {
                label: t('Transactions.infos.date'),
                value: f(getDate(transaction), 'dddd D MMMM')
              }
            ].filter(x => x.value)}
          />
        </ListItemText>
      </ListItem>

      <ListItem
        divider
        button
        disableRipple
        onClick={() => handleSelectRow('category')}
      >
        <ListItemIcon>
          <CategoryIcon categoryId={categoryId} />
        </ListItemIcon>
        <ListItemText>
          {t(
            `Data.subcategories.${getCategoryName(getCategoryId(transaction))}`
          )}
        </ListItemText>
        <ListItemArrow />
      </ListItem>

      <ListItem
        divider
        button
        disableRipple
        onClick={() => handleSelectRow('application-date')}
      >
        <ListItemIcon>
          <Icon icon={iconCalendar} />
        </ListItemIcon>
        <ListItemText>
          {t('Transactions.infos.assignedToPeriod', {
            date: f(
              getApplicationDate(transaction) || getDate(transaction),
              'MMM YYYY'
            )
          })}
        </ListItemText>
        {shouldShowRestoreApplicationDateIcon && (
          <IconButton onClick={handleResetApplicationDate} size="medium">
            <Icon color="var(--slateGrey)" icon={RestoreIcon} />
          </IconButton>
        )}
        {applicationDateBusy && <Spinner />}
        <ListItemArrow />
      </ListItem>

      <RecurrenceRow
        transaction={transaction}
        onClick={() => handleSelectRow('recurrence')}
      />
      <TransactionActions
        transaction={transaction}
        displayDefaultAction
        isModalItem
      />

      <TagListItem transaction={transaction} withIcon={false} />

      <DeleteTransactionRow transaction={transaction} onDelete={requestClose} />

      {selectedRow === 'category' && (
        <TransactionCategoryEditorDialog
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      )}

      {selectedRow === 'application-date' && (
        <TransactionApplicationDateEditorDialog
          beforeUpdate={() => setApplicationDateBusy(true)}
          afterUpdate={handleAfterUpdateApplicationDate}
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      )}

      {selectedRow === 'recurrence' && (
        <TransactionRecurrenceEditorDialog
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      )}
    </List>
  )
}

export default React.memo(TransactionModalInfoContent)
