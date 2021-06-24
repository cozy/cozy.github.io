import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Chip from 'cozy-ui/transpiled/react/Chip'

import { Link } from 'react-router'

import { useClient } from 'cozy-client'

import Figure from 'cozy-ui/transpiled/react/Figure'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import MagnifierIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'
import RestoreIcon from 'cozy-ui/transpiled/react/Icons/Restore'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Button from 'cozy-ui/transpiled/react/Button'

import CategoryIcon from 'ducks/categories/CategoryIcon'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import {
  getCategoryId,
  updateApplicationDate,
  getDate,
  getApplicationDate
} from 'ducks/transactions/helpers'

import { getLabel } from 'ducks/transactions'
import TransactionActions from 'ducks/transactions/TransactionActions'
import styles from 'ducks/transactions/TransactionModal.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'

import iconCredit from 'components/IconCredit'
import iconCalendar from 'components/IconCalendar'
import iconRecurrence from 'components/IconRecurrence'

import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import flag from 'cozy-flags'

import {
  trackEvent,
  useTrackPage,
  trackParentPage,
  trackPage,
  replaceLastPart
} from 'ducks/tracking/browser'
import { getFrequencyText } from 'ducks/recurrence/utils'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'
import TransactionApplicationDateEditor from 'ducks/transactions/TransactionApplicationDateEditor'
import TransactionRecurrenceEditor from 'ducks/transactions/TransactionRecurrenceEditor'

import useDocument from 'components/useDocument'
import { useLocation } from 'components/RouterContext'
import ListItemArrow from 'components/ListItemArrow'
import RawContentDialog from 'components/RawContentDialog'

const SearchForTransactionIcon = ({ transaction }) => {
  const label = getLabel(transaction)
  return (
    <a href={`#/search/${label}`}>
      <Icon className="u-ml-half u-coolGrey" icon={MagnifierIcon} />
    </a>
  )
}

const TransactionLabel = ({ transaction }) => {
  const label = getLabel(transaction)

  return (
    <Typography variant="h6" gutterBottom>
      {label}
      {
        <>
          {' '}
          <SearchForTransactionIcon transaction={transaction} />
        </>
      }
    </Typography>
  )
}

const TransactionInfo = ({ label, value }) => (
  <div className={styles.TransactionInfo}>
    <span className={styles.TransactionInfoLabel}>{label} :</span>
    {value}
  </div>
)

const TransactionInfos = ({ infos }) => (
  <div>
    {infos.map(({ label, value }) => (
      <TransactionInfo key={label} label={label} value={value} />
    ))}
  </div>
)

const TransactionCategoryEditorDialog = ({ transaction, onClose }) => {
  const onAfterUpdate = transaction => {
    trackEvent({
      name: getCategoryName(transaction.manualCategoryId)
    })
  }

  useTrackPage(lastTracked => replaceLastPart(lastTracked, 'depense-categorie'))

  const handlePop = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  return (
    <TransactionCategoryEditor
      beforeUpdate={handlePop}
      afterUpdate={onAfterUpdate}
      onCancel={handlePop}
      transaction={transaction}
    />
  )
}

const TransactionApplicationDateEditorDialog = ({
  transaction,
  beforeUpdate,
  afterUpdate,
  onClose
}) => {
  const { t } = useI18n()

  useTrackPage(lastTracked =>
    replaceLastPart(lastTracked, `depense-affectation_mois`)
  )

  const handleClose = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  const handleBeforeUpdate = () => {
    beforeUpdate()
    handleClose()
  }

  return (
    <RawContentDialog
      open
      size="small"
      title={t('Transactions.infos.chooseApplicationDate')}
      onClose={handleClose}
      content={
        <TransactionApplicationDateEditor
          beforeUpdate={handleBeforeUpdate}
          afterUpdate={afterUpdate}
          transaction={transaction}
        />
      }
    />
  )
}

export const showAlertAfterApplicationDateUpdate = (transaction, t, f) => {
  const date = getApplicationDate(transaction) || getDate(transaction)
  Alerter.success(
    t('Transactions.infos.applicationDateChangedAlert', {
      applicationDate: f(date, 'MMMM')
    })
  )
}

const stopPropagation = ev => ev.stopPropagation()

const RecurrenceRow = ({ transaction, onClick }) => {
  const location = useLocation()
  const recurrence = transaction.recurrence && transaction.recurrence.data
  const { t } = useI18n()

  const recurrenceRoute = recurrence
    ? `/analysis/recurrence/${recurrence._id}`
    : null

  const vAlignTop = Boolean(recurrence)
  return (
    <ListItem
      divider
      button
      disableRipple
      alignItems={vAlignTop ? 'flex-start' : undefined}
      onClick={onClick}
    >
      <ListItemIcon>
        <Icon
          icon={iconRecurrence}
          className={vAlignTop ? 'u-mt-1-half' : null}
        />
      </ListItemIcon>
      <ListItemText>
        <div>
          {recurrence
            ? t('Recurrence.choice.recurrent')
            : t('Recurrence.choice.not-recurrent')}
          {recurrence ? (
            <>
              <br />
              <Typography variant="caption" color="textSecondary">
                {getFrequencyText(t, recurrence)}
              </Typography>
              {location.pathname !== recurrenceRoute ? (
                <Link to={recurrenceRoute} className="u-link">
                  <div className="u-mh-1">
                    <Chip
                      onClick={stopPropagation}
                      variant="outlined"
                      size="small"
                      className="u-w-100 u-ph-2 u-mt-half u-flex-justify-center"
                    >
                      {t('Recurrence.see-transaction-history')}
                    </Chip>
                  </div>
                </Link>
              ) : null}
            </>
          ) : null}
        </div>
      </ListItemText>
      <ListItemArrow className={vAlignTop ? 'u-mt-1-half' : null} />
    </ListItem>
  )
}

const TransactionRecurrenceEditorDialog = ({ transaction, onClose }) => {
  const { t } = useI18n()

  useTrackPage(lastTracked =>
    replaceLastPart(lastTracked, 'depense-affectation_recurrence')
  )

  const handleClose = useCallback(() => {
    trackPage(lastTracked => replaceLastPart(lastTracked, 'depense'))
    onClose()
  }, [onClose])

  return (
    <RawContentDialog
      size="small"
      open
      onClose={handleClose}
      title={t('Transactions.infos.chooseRecurrence')}
      content={
        <TransactionRecurrenceEditor
          onSelect={x => x}
          beforeUpdate={handleClose}
          onCancel={handleClose}
          transaction={transaction}
        />
      }
    />
  )
}

const DeleteTransactionRow = ({ transaction }) => {
  const { t } = useI18n()
  const client = useClient()
  const [showingDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleRequestDeleteTransaction = () => {
    setShowDeleteConfirmation(true)
  }

  const handleCancelDeleteTransactions = () => {
    setShowDeleteConfirmation(false)
  }

  const handleConfirmDeleteTransaction = async () => {
    try {
      setDeleting(true)
      await client.destroy(transaction)
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
                value: getAccountLabel(account)
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
        {shouldShowRestoreApplicationDateIcon ? (
          <IconButton onClick={handleResetApplicationDate}>
            <Icon color="var(--slateGrey)" icon={RestoreIcon} />
          </IconButton>
        ) : null}
        {applicationDateBusy ? <Spinner /> : null}
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

      <DeleteTransactionRow transaction={transaction} onDelete={requestClose} />

      {selectedRow == 'category' ? (
        <TransactionCategoryEditorDialog
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      ) : null}

      {selectedRow == 'application-date' ? (
        <TransactionApplicationDateEditorDialog
          beforeUpdate={() => setApplicationDateBusy(true)}
          afterUpdate={handleAfterUpdateApplicationDate}
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      ) : null}
      {selectedRow == 'recurrence' && (
        <TransactionRecurrenceEditorDialog
          transaction={transaction}
          onClose={handleCloseChildModal}
        />
      )}
    </List>
  )
}

const TransactionModal = ({ requestClose, transactionId, ...props }) => {
  const transaction = useDocument(TRANSACTION_DOCTYPE, transactionId)
  const location = useLocation()

  useTrackPage(lastTracked => {
    // We cannot simply add ":depense" to the last tracked page because
    // we need to limit the number of segments to 3 of the hit. This is
    // why when coming from the balances page, we change the page to
    // mon_compte:depense and when coming from the category details page, we
    // replace the :details portion by :depense by splitting & slicing.
    if (lastTracked == 'mon_compte:compte') {
      return 'mon_compte:depense'
    } else {
      return replaceLastPart(lastTracked, 'depense')
    }
  })

  const handleClose = useCallback(
    ev => {
      if (location.pathname.startsWith('/balances/details')) {
        trackPage('mon_compte:compte')
      } else if (location.pathname.startsWith('/analysis/categories')) {
        trackPage(lastTracked => replaceLastPart(lastTracked, 'details'))
      } else {
        trackParentPage()
      }
      ev.preventDefault()
      requestClose()
    },
    [location, requestClose]
  )

  if (!transaction) {
    return null // transaction is being deleted
  }

  return (
    <RawContentDialog
      size="medium"
      open
      onClose={handleClose}
      title={
        <div className="u-ta-center">
          <Figure
            total={transaction.amount}
            symbol={getCurrencySymbol(transaction.currency)}
            signed
          />
        </div>
      }
      content={
        <TransactionModalInfoContent
          {...props}
          transactionId={transactionId}
          requestClose={handleClose}
        />
      }
    />
  )
}

TransactionModal.propTypes = {
  requestClose: PropTypes.func.isRequired,
  transactionId: PropTypes.string.isRequired
}

export default TransactionModal
