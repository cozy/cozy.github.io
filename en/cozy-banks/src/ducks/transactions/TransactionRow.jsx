import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import Typography from 'cozy-ui/transpiled/react/Typography'
import LogoutIcon from 'cozy-ui/transpiled/react/Icons/Logout'
import Figure from 'cozy-ui/transpiled/react/Figure'

import flag from 'cozy-flags'

import { TdSecondary } from 'components/Table'

import TransactionActions from 'ducks/transactions/TransactionActions'
import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'

import { getCategoryName } from 'ducks/categories/categoriesMap'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import {
  getCategoryId,
  getLabel,
  getDate,
  getApplicationDate
} from 'ducks/transactions/helpers'

import { getFrequencyText } from 'ducks/recurrence/utils'
import styles from 'ducks/transactions/Transactions.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'

import TransactionModal from 'ducks/transactions/TransactionModal'
import TransactionCategoryEditor from 'ducks/transactions/TransactionCategoryEditor'

import iconRecurrence from 'assets/icons/icon-recurrence.svg'

import useSwitch from 'hooks/useSwitch'

const useTransactionModal = transaction => {
  const [modalOpened, show, hide] = useSwitch(false)
  const modal = modalOpened ? (
    <TransactionModal requestClose={hide} transactionId={transaction._id} />
  ) : null
  return [show, hide, modal]
}

const useTransactionCategoryModal = transaction => {
  const [modalOpened, show, hide] = useSwitch(false)
  const modal = modalOpened ? (
    <TransactionCategoryEditor
      beforeUpdate={hide}
      onCancel={hide}
      transaction={transaction}
    />
  ) : null
  return [show, hide, modal]
}

const TransactionDate = ({ isExtraLarge, transaction }) => {
  const { t, f } = useI18n()
  return (
    <span
      title={
        transaction.realisationDate &&
        transaction.date !== transaction.realisationDate
          ? t('Transactions.will-be-debited-on', {
              date: f(transaction.date, 'D MMMM YYYY')
            })
          : null
      }
    >
      {f(getDate(transaction), `D ${isExtraLarge ? 'MMMM' : 'MMM'} YYYY`)}
    </span>
  )
}

const AccountCaption = React.memo(function AccountCaption({ account }) {
  const accountInstitutionLabel = getAccountInstitutionLabel(account)
  return (
    <Typography className="u-ellipsis" variant="caption" color="textSecondary">
      {getAccountLabel(account)}
      {accountInstitutionLabel && ` - ${accountInstitutionLabel}`}
    </Typography>
  )
})

const ApplicationDateCaption = React.memo(function ApplicationDateCaption({
  transaction
}) {
  const { f } = useI18n()
  const applicationDate = getApplicationDate(transaction)
  return (
    <Typography variant="caption" color="textSecondary">
      <Icon size={10} icon={LogoutIcon} /> {f(applicationDate, 'MMMM')}
    </Typography>
  )
})

const RecurrenceCaption = ({ recurrence }) => {
  const { t } = useI18n()
  const freqText = getFrequencyText(t, recurrence)
  return (
    <Typography variant="caption" color="textSecondary">
      {freqText} <Icon icon={iconRecurrence} size="10" />
    </Typography>
  )
}

const showTransactionActions = !flag('banks.transaction-actions.deactivated')

export const RowDesktop = React.memo(function RowDesktop(props) {
  const { t } = useI18n()
  const {
    transaction,
    isExtraLarge,
    filteringOnAccount,
    onRef,
    showRecurrence
  } = props

  const boundOnRef = useMemo(() => {
    return onRef ? onRef.bind(null, transaction._id) : null
  }, [onRef, transaction])

  const categoryId = getCategoryId(transaction)
  const categoryName = getCategoryName(categoryId)
  const categoryTitle = t(`Data.subcategories.${categoryName}`)

  const account = transaction.account.data
  const recurrence = transaction.recurrence ? transaction.recurrence.data : null
  const trRest = flag('show-transactions-ids') ? { id: transaction._id } : {}

  const applicationDate = getApplicationDate(transaction)

  const [showTransactionModal, , transactionModal] = useTransactionModal(
    transaction
  )

  const [
    showTransactionCategoryModal,
    ,
    categoryModal
  ] = useTransactionCategoryModal(transaction)

  const handleClickCategory = useCallback(
    ev => {
      ev.preventDefault()
      showTransactionCategoryModal()
    },
    [showTransactionCategoryModal]
  )

  const handleClickRow = useCallback(
    ev => {
      if (ev.defaultPrevented) {
        return
      }
      if (!ev.currentTarget.contains(ev.target)) {
        return
      }
      showTransactionModal()
    },
    [showTransactionModal]
  )

  // Virtual transactions, like those generated from recurrences, cannot be edited
  const canEditTransaction = transaction._id

  return (
    <>
      <tr
        ref={boundOnRef}
        {...trRest}
        className={cx(
          styles.TransactionRow,
          canEditTransaction ? styles['TransactionRow--editable'] : null
        )}
        onClick={canEditTransaction && handleClickRow}
      >
        <td className={cx(styles.ColumnSizeDesc, 'u-pv-half', 'u-pl-1')}>
          <Media>
            <Img
              title={categoryTitle}
              onClick={canEditTransaction && handleClickCategory}
            >
              <CategoryIcon
                categoryId={categoryId}
                className={styles['bnk-op-caticon']}
              />
            </Img>
            <Bd className="u-pl-1">
              <ListItemText
                className="u-pv-half"
                onClick={canEditTransaction && showTransactionModal}
              >
                <Typography variant="body1">{getLabel(transaction)}</Typography>
                {!filteringOnAccount && <AccountCaption account={account} />}
                {applicationDate ? (
                  <ApplicationDateCaption transaction={transaction} />
                ) : null}
                {recurrence && showRecurrence ? (
                  <RecurrenceCaption recurrence={recurrence} />
                ) : null}
              </ListItemText>
            </Bd>
          </Media>
        </td>
        <TdSecondary
          className={styles.ColumnSizeDate}
          onClick={showTransactionModal}
        >
          <TransactionDate
            isExtraLarge={isExtraLarge}
            transaction={transaction}
          />
        </TdSecondary>
        <TdSecondary
          className={styles.ColumnSizeAmount}
          onClick={showTransactionModal}
        >
          <Figure
            total={transaction.amount || 0}
            symbol={getCurrencySymbol(transaction.currency)}
            coloredPositive
            signed
          />
        </TdSecondary>
        {showTransactionActions && (
          <TdSecondary className={styles.ColumnSizeAction}>
            <TransactionActions transaction={transaction} onlyDefault />
          </TdSecondary>
        )}
      </tr>
      {categoryModal}
      {transactionModal}
    </>
  )
})

RowDesktop.defaultProps = {
  showRecurrence: true
}

export const RowMobile = React.memo(function RowMobile(props) {
  const { t } = useI18n()
  const { transaction, filteringOnAccount, onRef, showRecurrence } = props
  const account = transaction.account.data
  const rowRest = {}
  const [rawShowTransactionModal, , transactionModal] = useTransactionModal(
    transaction
  )

  const boundOnRef = useMemo(() => {
    return onRef.bind(null, transaction._id)
  }, [onRef, transaction])

  const showTransactionModal = useCallback(
    ev => {
      ev.preventDefault()
      rawShowTransactionModal()
    },
    [rawShowTransactionModal]
  )

  if (flag('show-transactions-ids')) {
    rowRest.id = transaction._id
  }

  rowRest.className = cx(styles.TransactionRowMobile)

  const applicationDate = getApplicationDate(transaction)
  const recurrence = transaction.recurrence ? transaction.recurrence.data : null

  return (
    <>
      <ListItem ref={boundOnRef} {...rowRest} button={!!transaction._id}>
        <Media className="u-w-100">
          <Img
            className="u-mr-half"
            title={t(
              `Data.subcategories.${getCategoryName(
                getCategoryId(transaction)
              )}`
            )}
            onClick={transaction._id && showTransactionModal}
          >
            <CategoryIcon categoryId={getCategoryId(transaction)} />
          </Img>
          <Bd className="u-mr-half">
            <ListItemText onClick={transaction._id && showTransactionModal}>
              <Typography className="u-ellipsis" variant="body1">
                {getLabel(transaction)}
              </Typography>
              {!filteringOnAccount && <AccountCaption account={account} />}
              {applicationDate ? (
                <ApplicationDateCaption transaction={transaction} />
              ) : null}
            </ListItemText>
          </Bd>
          <Img
            onClick={showTransactionModal}
            className={styles.TransactionRowMobileImg}
          >
            <Figure
              total={transaction.amount}
              symbol={getCurrencySymbol(transaction.currency)}
              coloredPositive
              signed
            />
            {recurrence && showRecurrence ? (
              <RecurrenceCaption recurrence={recurrence} />
            ) : null}
          </Img>
        </Media>
        {showTransactionActions && (
          <TransactionActions
            transaction={transaction}
            onlyDefault
            compact
            menuPosition="right"
            className={cx(
              'u-w-100',
              'u-mb-half',
              styles.TransactionRowMobile__actions
            )}
          />
        )}
      </ListItem>
      {transactionModal}
    </>
  )
})

RowMobile.propTypes = {
  transaction: PropTypes.object.isRequired,
  showRecurrence: PropTypes.bool
}

RowMobile.defaultProps = {
  showRecurrence: true
}
