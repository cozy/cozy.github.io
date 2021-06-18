import React, { useCallback, useMemo } from 'react'
import cx from 'classnames'

import flag from 'cozy-flags'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Figure from 'cozy-ui/transpiled/react/Figure'

import { TdSecondary } from 'components/Table'
import TransactionActions from 'ducks/transactions/TransactionActions'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import {
  getCategoryId,
  getLabel,
  getApplicationDate
} from 'ducks/transactions/helpers'
import styles from 'ducks/transactions/Transactions.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'
import {
  useTransactionModal,
  useTransactionCategoryModal,
  showTransactionActions
} from 'ducks/transactions/TransactionRow'
import ApplicationDateCaption from 'ducks/transactions/TransactionRow/ApplicationDateCaption'
import AccountCaption from 'ducks/transactions/TransactionRow/AccountCaption'
import TransactionDate from 'ducks/transactions/TransactionRow/TransactionDate'
import RecurrenceCaption from 'ducks/transactions/TransactionRow/RecurrenceCaption'

const TransactionRowDesktop = props => {
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
}

TransactionRowDesktop.defaultProps = {
  showRecurrence: true
}

export default React.memo(TransactionRowDesktop)
