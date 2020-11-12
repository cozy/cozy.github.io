import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { Media, Bd, Img, Icon, useI18n } from 'cozy-ui/transpiled/react'
import flag from 'cozy-flags'

import Figure from 'cozy-ui/transpiled/react/Figure'
import { TdSecondary } from 'components/Table'
import * as List from 'components/List'

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

import Typography from 'cozy-ui/transpiled/react/Typography'

import LogoutIcon from 'cozy-ui/transpiled/react/Icons/Logout'

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
      modal={true}
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

export const RowDesktop = React.memo(function RowDesktop(props) {
  const { t } = useI18n()
  const {
    transaction,
    isExtraLarge,
    filteringOnAccount,
    onRef,
    showRecurrence
  } = props

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

  return (
    <tr ref={onRef} {...trRest} className="u-clickable">
      <td className={cx(styles.ColumnSizeDesc, 'u-pv-half', 'u-pl-1')}>
        <Media className="u-clickable">
          <Img title={categoryTitle} onClick={showTransactionCategoryModal}>
            <CategoryIcon
              categoryId={categoryId}
              className={styles['bnk-op-caticon']}
            />
          </Img>
          <Bd className="u-pl-1">
            <List.Content onClick={showTransactionModal}>
              <Typography variant="body1">{getLabel(transaction)}</Typography>
              {!filteringOnAccount && <AccountCaption account={account} />}
              {applicationDate ? (
                <ApplicationDateCaption transaction={transaction} />
              ) : null}
              {recurrence && showRecurrence ? (
                <RecurrenceCaption recurrence={recurrence} />
              ) : null}
            </List.Content>
          </Bd>
        </Media>
      </td>
      <TdSecondary
        className={cx(styles.ColumnSizeDate, 'u-clickable')}
        onClick={showTransactionModal}
      >
        <TransactionDate
          isExtraLarge={isExtraLarge}
          transaction={transaction}
        />
      </TdSecondary>
      <TdSecondary
        className={cx(styles.ColumnSizeAmount, 'u-clickable')}
        onClick={showTransactionModal}
      >
        <Figure
          total={transaction.amount}
          symbol={getCurrencySymbol(transaction.currency)}
          coloredPositive
          signed
        />
      </TdSecondary>
      <TdSecondary className={styles.ColumnSizeAction}>
        <TransactionActions transaction={transaction} onlyDefault />
      </TdSecondary>
      {transactionModal}
      {categoryModal}
    </tr>
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
  const [showTransactionModal, , transactionModal] = useTransactionModal(
    transaction
  )

  if (flag('show-transactions-ids')) {
    rowRest.id = transaction._id
  }

  rowRest.className = cx(styles.TransactionRowMobile)

  const applicationDate = getApplicationDate(transaction)
  const recurrence = transaction.recurrence ? transaction.recurrence.data : null

  return (
    <List.Row onRef={onRef} {...rowRest}>
      <Media className="u-w-100">
        <Img
          className="u-clickable u-mr-half"
          title={t(
            `Data.subcategories.${getCategoryName(getCategoryId(transaction))}`
          )}
          onClick={showTransactionModal}
        >
          <CategoryIcon categoryId={getCategoryId(transaction)} />
        </Img>
        <Bd className="u-clickable u-mr-half">
          <List.Content onClick={showTransactionModal}>
            <Typography className="u-ellipsis" variant="body1">
              {getLabel(transaction)}
            </Typography>
            {!filteringOnAccount && <AccountCaption account={account} />}
            {applicationDate ? (
              <ApplicationDateCaption transaction={transaction} />
            ) : null}
          </List.Content>
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
        {false}
      </Media>
      <TransactionActions
        transaction={transaction}
        onlyDefault
        compact
        menuPosition="right"
        className={cx(
          'u-mt-half',
          'u-ml-2-half',
          styles.TransactionRowMobile__actions
        )}
      />
      {transactionModal}
    </List.Row>
  )
})

RowMobile.propTypes = {
  transaction: PropTypes.object.isRequired,
  showRecurrence: PropTypes.bool
}

RowMobile.defaultProps = {
  showRecurrence: true
}
