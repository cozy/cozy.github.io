/**
 * Is used in mobile/tablet mode when you click on the more button
 */

import React, { Component } from 'react'
import { translate, withBreakpoints } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import { Media, Bd, Img } from 'cozy-ui/react/Media'
import { withDispatch } from 'utils'
import { flowRight as compose } from 'lodash'
import cx from 'classnames'

import { Query } from 'cozy-client'

import { Figure } from 'components/Figure'
import { PageModal } from 'components/PageModal'

import { getLabel } from 'ducks/transactions'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import { getCategoryName } from 'ducks/categories/categoriesMap'
import TransactionActions from 'ducks/transactions/TransactionActions'
import { withUpdateCategory } from 'ducks/categories'
import PropTypes from 'prop-types'
import { getCategoryId } from 'ducks/categories/helpers'
import styles from 'ducks/transactions/TransactionModal.styl'
import { getCurrencySymbol } from 'utils/currencySymbol'

import iconGraph from 'assets/icons/icon-graph.svg'
import iconCredit from 'assets/icons/icon-credit.svg'
import iconCalendar from 'assets/icons/icon-calendar.svg'
import {
  getAccountLabel,
  getAccountInstitutionLabel
} from 'ducks/account/helpers'
import { TRANSACTION_DOCTYPE } from 'doctypes'
import { isCollectionLoading } from 'ducks/client/utils'
import flag from 'cozy-flags'
import { getDate } from 'ducks/transactions/helpers'

const Separator = () => <hr className={styles.TransactionModalSeparator} />

export const TransactionModalRow = ({
  children,
  iconLeft,
  iconRight,
  disabled = false,
  className,
  onClick,
  ...props
}) => (
  <Media
    className={cx(
      styles.TransactionModalRow,
      {
        [styles['TransactionModalRow-disabled']]: disabled,
        [styles['TransactionModalRow-clickable']]: onClick,
        'u-pl-1-half': iconLeft,
        'u-pr-1-half': iconRight
      },
      className
    )}
    onClick={onClick}
    {...props}
  >
    {iconLeft && (
      <Img
        className={cx(styles.TransactionModalRowIcon, {
          [styles['TransactionModalRowIcon-alignTop']]: props.align === 'top'
        })}
      >
        {Icon.isProperIcon(iconLeft) ? (
          <Icon icon={iconLeft} width={16} />
        ) : (
          iconLeft
        )}
      </Img>
    )}
    <Bd className={styles.TransactionModalRowContent}>{children}</Bd>
    {iconRight && <Img>{iconRight}</Img>}
  </Media>
)

const TransactionLabel = ({ label }) => (
  <div className={styles.TransactionLabel}>{label}</div>
)

const TransactionInfo = ({ label, value }) => (
  <div className={styles.TransactionInfo}>
    <span className={styles.TransactionInfoLabel}>{label} :</span>
    {value}
  </div>
)

const TransactionInfos = ({ infos }) => (
  <div className={styles.TransactionInfos}>
    {infos.map(({ label, value }) => (
      <TransactionInfo key={label} label={label} value={value} />
    ))}
  </div>
)

const transactionModalRowStyle = { textTransform: 'capitalize' }
class TransactionModal extends Component {
  renderContent() {
    const { t, f, transaction, showCategoryChoice, ...props } = this.props

    const categoryId = getCategoryId(transaction)
    const account = transaction.account.data

    const typeIcon = (
      <Icon
        icon={iconCredit}
        width={16}
        className={cx(styles['TransactionModalRowIcon-alignTop'], {
          [styles['TransactionModalRowIcon-reversed']]: transaction.amount < 0
        })}
      />
    )

    return (
      <div>
        <TransactionModalRow
          iconLeft={typeIcon}
          className={styles['TransactionModalRow-multiline']}
          align="top"
        >
          <TransactionLabel label={getLabel(transaction)} />
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
              }
            ].filter(x => x.value)}
          />
        </TransactionModalRow>
        <Separator />
        <TransactionModalRow iconLeft={iconCalendar}>
          <span style={transactionModalRowStyle}>
            {f(getDate(transaction), 'dddd DD MMMM')}
          </span>
        </TransactionModalRow>
        <Separator />
        <TransactionModalRow
          iconLeft={iconGraph}
          iconRight={<CategoryIcon categoryId={categoryId} />}
          onClick={showCategoryChoice}
        >
          {t(
            `Data.subcategories.${getCategoryName(getCategoryId(transaction))}`
          )}
        </TransactionModalRow>
        <Separator />
        <TransactionActions
          transaction={transaction}
          {...props}
          displayDefaultAction
          isModalItem
        />
      </div>
    )
  }

  renderHeader() {
    const { transaction } = this.props

    return (
      <h2 className={styles.TransactionModalHeading}>
        <Figure
          total={transaction.amount}
          symbol={getCurrencySymbol(transaction.currency)}
          signed
        />
      </h2>
    )
  }

  render() {
    return (
      <PageModal
        dismissAction={this.props.requestClose}
        into="body"
        title={this.renderHeader()}
      >
        {this.renderContent()}
      </PageModal>
    )
  }
}

TransactionModal.propTypes = {
  showCategoryChoice: PropTypes.func.isRequired,
  requestClose: PropTypes.func.isRequired,
  transactionId: PropTypes.string.isRequired,
  transaction: PropTypes.object.isRequired
}

const DumbTransactionModal = compose(
  translate(),
  withBreakpoints()
)(TransactionModal)

const NeedResult = props => {
  const { children: renderFun, ...restProps } = props
  return (
    <Query {...restProps}>
      {collection => {
        if (isCollectionLoading(collection)) {
          return null
        } else {
          return renderFun(collection)
        }
      }}
    </Query>
  )
}

const withTransaction = Component => {
  const Wrapped = props => {
    return (
      <NeedResult
        query={client =>
          client
            .get(TRANSACTION_DOCTYPE, props.transactionId)
            .include(['account'])
        }
      >
        {({ data: transaction }) => {
          return <Component {...props} transaction={transaction} />
        }}
      </NeedResult>
    )
  }
  return Wrapped
}

export default compose(
  withDispatch,
  withTransaction,
  withUpdateCategory()
)(DumbTransactionModal)

export { DumbTransactionModal }
