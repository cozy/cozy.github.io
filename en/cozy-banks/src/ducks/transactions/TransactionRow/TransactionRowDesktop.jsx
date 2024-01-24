import React, { useCallback, useMemo } from 'react'
import cx from 'classnames'

import flag from 'cozy-flags'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'

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
import TagChips from 'components/Tag/TagChips'

const TransactionRowDesktop = ({
  transaction,
  isExtraLarge,
  filteringOnAccount,
  onRef,
  showRecurrence,
  isSelected,
  isSelectionModeActive,
  toggleSelection
}) => {
  const { t } = useI18n()

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

  const [showTransactionModal, , transactionModal] =
    useTransactionModal(transaction)

  const [showTransactionCategoryModal, , categoryModal] =
    useTransactionCategoryModal({ transactions: [transaction] })

  const handleClickCategory = useCallback(
    ev => {
      ev.preventDefault()
      if (isSelectionModeActive) {
        toggleSelection(transaction)
      } else {
        showTransactionCategoryModal()
      }
    },
    [
      isSelectionModeActive,
      showTransactionCategoryModal,
      toggleSelection,
      transaction
    ]
  )

  const handleClickCheckbox = useCallback(
    ev => {
      ev.preventDefault()
      toggleSelection(transaction)
    },
    [toggleSelection, transaction]
  )

  const handleClickRow = useCallback(
    ev => {
      if (ev.defaultPrevented) {
        return
      }
      if (!ev.currentTarget.contains(ev.target)) {
        return
      }
      if (isSelectionModeActive) {
        toggleSelection(transaction)
      } else {
        showTransactionModal()
      }
    },
    [isSelectionModeActive, showTransactionModal, toggleSelection, transaction]
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
          canEditTransaction ? styles['TransactionRow--editable'] : null,
          {
            [styles['TransactionRow--selected']]: isSelected
          }
        )}
        onClick={canEditTransaction && handleClickRow}
      >
        {canEditTransaction && (
          <TdSecondary
            className={cx(styles.ColumnSizeCheckbox, 'u-pl-0 u-ta-center')}
            onClick={handleClickCheckbox}
          >
            <Checkbox
              data-testid={`TransactionRow-checkbox-${transaction._id}`}
              checked={isSelected}
              readOnly
            />
          </TdSecondary>
        )}
        <td
          className={cx(
            styles.ColumnSizeDesc,
            'u-pv-half',
            canEditTransaction ? 'u-pl-0' : 'u-pl-1'
          )}
        >
          <Media>
            <Img title={categoryTitle}>
              <IconButton
                disabled={!canEditTransaction}
                className={styles.CategoryIconButton}
                onClick={canEditTransaction && handleClickCategory}
                size="medium"
              >
                <CategoryIcon
                  categoryId={categoryId}
                  className={styles['bnk-op-caticon']}
                />
              </IconButton>
            </Img>
            <Bd className="u-pl-1">
              <ListItemText className="u-pv-half" disableTypography>
                <Typography variant="body1">{getLabel(transaction)}</Typography>
                {!filteringOnAccount && <AccountCaption account={account} />}
                {applicationDate && (
                  <ApplicationDateCaption transaction={transaction} />
                )}
                {recurrence && showRecurrence && (
                  <RecurrenceCaption recurrence={recurrence} />
                )}
              </ListItemText>
            </Bd>
          </Media>
        </td>
        <TdSecondary className={styles.ColumnSizeDate}>
          <TransactionDate
            isExtraLarge={isExtraLarge}
            transaction={transaction}
          />
        </TdSecondary>
        <TdSecondary className={styles.ColumnSizeAmount}>
          <Figure
            total={transaction.amount || 0}
            symbol={getCurrencySymbol(transaction.currency)}
            coloredPositive
            signed
          />
        </TdSecondary>
        <TdSecondary className={styles.ColumnSizeAction}>
          {showTransactionActions && (
            <TransactionActions transaction={transaction} onlyDefault />
          )}
          <TagChips transaction={transaction} clickable />
        </TdSecondary>
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
