import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import Tappable from 'react-tappable/lib/Tappable'

import flag from 'cozy-flags'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'

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
  showTransactionActions
} from 'ducks/transactions/TransactionRow'
import ApplicationDateCaption from 'ducks/transactions/TransactionRow/ApplicationDateCaption'
import AccountCaption from 'ducks/transactions/TransactionRow/AccountCaption'
import RecurrenceCaption from 'ducks/transactions/TransactionRow/RecurrenceCaption'
import { useSelectionContext } from 'ducks/context/SelectionContext'

const TransactionRowMobile = props => {
  const { t } = useI18n()
  const { transaction, filteringOnAccount, onRef, showRecurrence } = props
  const account = transaction.account.data
  const rowRest = {}
  const [rawShowTransactionModal, , transactionModal] = useTransactionModal(
    transaction
  )

  const {
    isSelectionModeActive,
    toggleSelection,
    isItemSelected: isTransactionSelected
  } = useSelectionContext(transaction)

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

  const handleTap = useCallback(
    ev => {
      if (isSelectionModeActive) {
        toggleSelection()
      } else {
        transaction._id && showTransactionModal(ev)
      }
    },
    [
      isSelectionModeActive,
      showTransactionModal,
      toggleSelection,
      transaction._id
    ]
  )

  return (
    <>
      <ListItem
        ref={boundOnRef}
        {...rowRest}
        className={cx({
          [styles['TransactionRow--selected']]: isTransactionSelected,
          'u-pl-0': isSelectionModeActive
        })}
        button={!!transaction._id}
      >
        <Media className="u-w-100">
          {isSelectionModeActive && (
            <Img>
              <Tappable
                onTap={handleTap}
                onPress={toggleSelection}
                pressDelay={250}
              >
                <Checkbox checked={isTransactionSelected} readOnly />
              </Tappable>
            </Img>
          )}
          <Bd>
            <Media className="u-w-100">
              <Img
                className="u-mr-half"
                title={t(
                  `Data.subcategories.${getCategoryName(
                    getCategoryId(transaction)
                  )}`
                )}
              >
                <Tappable
                  onTap={handleTap}
                  onPress={toggleSelection}
                  pressDelay={250}
                >
                  <CategoryIcon categoryId={getCategoryId(transaction)} />
                </Tappable>
              </Img>
              <Bd className="u-mr-half">
                <Tappable
                  onTap={handleTap}
                  onPress={toggleSelection}
                  pressDelay={250}
                >
                  <ListItemText>
                    <Typography className="u-ellipsis" variant="body1">
                      {getLabel(transaction)}
                    </Typography>
                    {!filteringOnAccount && (
                      <AccountCaption account={account} />
                    )}
                    {applicationDate ? (
                      <ApplicationDateCaption transaction={transaction} />
                    ) : null}
                  </ListItemText>
                </Tappable>
              </Bd>
              <Img className={styles.TransactionRowMobileImg}>
                <Tappable
                  onTap={handleTap}
                  onPress={toggleSelection}
                  pressDelay={250}
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
                </Tappable>
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
          </Bd>
        </Media>
      </ListItem>
      {transactionModal}
    </>
  )
}

TransactionRowMobile.propTypes = {
  transaction: PropTypes.object.isRequired,
  showRecurrence: PropTypes.bool
}

TransactionRowMobile.defaultProps = {
  showRecurrence: true
}

export default React.memo(TransactionRowMobile)
