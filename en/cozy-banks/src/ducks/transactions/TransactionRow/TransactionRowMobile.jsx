import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import flag from 'cozy-flags'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/deprecated/Media'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Divider from 'cozy-ui/transpiled/react/Divider'

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
import TransactionOpener from 'ducks/transactions/TransactionRow/TransactionOpener'
import TagChips from 'components/Tag/TagChips'

const RowCheckbox = ({ isSelected }) => {
  const { isSelectionModeActive } = useSelectionContext()

  return isSelectionModeActive ? (
    <Img style={{ marginLeft: '-1rem' }}>
      <Checkbox checked={isSelected} readOnly />
    </Img>
  ) : null
}

const dividerStyle = { marginLeft: '3.5rem' }

const TransactionRowMobile = ({
  transaction,
  filteringOnAccount,
  onRef,
  showRecurrence,
  isSelected,
  isSelectionModeActive,
  toggleSelection,
  hasDivider
}) => {
  const { t } = useI18n()
  const account = transaction.account.data
  const rowRest = {}
  const [showTransactionModal, , transactionModal] =
    useTransactionModal(transaction)

  const boundOnRef = useMemo(() => {
    return onRef ? onRef.bind(null, transaction._id) : null
  }, [onRef, transaction])

  if (flag('show-transactions-ids')) {
    rowRest.id = transaction._id
  }

  rowRest.className = cx(styles.TransactionRowMobile)

  const applicationDate = getApplicationDate(transaction)
  const recurrence = transaction.recurrence ? transaction.recurrence.data : null

  return (
    <>
      <TransactionOpener
        transaction={transaction}
        toggleSelection={toggleSelection}
        isSelectionModeActive={isSelectionModeActive}
        showTransactionModal={showTransactionModal}
      >
        <ListItem
          ref={boundOnRef}
          {...rowRest}
          className={cx({
            [styles['TransactionRow--selected']]: isSelected
          })}
          button={!!transaction._id}
        >
          <Media className="u-w-100">
            <RowCheckbox isSelected={isSelected} />
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
                  <CategoryIcon categoryId={getCategoryId(transaction)} />
                </Img>
                <Bd className="u-mr-half">
                  <ListItemText disableTypography>
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
                </Bd>
                <Img className={styles.TransactionRowMobileImg}>
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
              <div
                className={cx(
                  'u-mb-half',
                  styles.TransactionRowMobile__actions
                )}
              >
                {showTransactionActions && (
                  <TransactionActions
                    transaction={transaction}
                    onlyDefault
                    compact
                    menuPosition="right"
                  />
                )}
                <TagChips transaction={transaction} clickable />
              </div>
            </Bd>
          </Media>
        </ListItem>
        {hasDivider && <Divider style={dividerStyle} variant="inset" />}
      </TransactionOpener>
      {transactionModal}
    </>
  )
}

TransactionRowMobile.propTypes = {
  transaction: PropTypes.object.isRequired,
  showRecurrence: PropTypes.bool,
  hasDivider: PropTypes.bool
}

TransactionRowMobile.defaultProps = {
  showRecurrence: true
}

export default React.memo(TransactionRowMobile)
