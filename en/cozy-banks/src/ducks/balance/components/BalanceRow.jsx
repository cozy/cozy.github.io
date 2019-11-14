import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { flowRight as compose, uniq, get } from 'lodash'
import { withBreakpoints, translate } from 'cozy-ui/react'
import cx from 'classnames'
import { TdSecondary } from 'components/Table'
import { Figure } from 'components/Figure'
import { getFilteringDoc } from 'ducks/filters'
import {
  getAccountInstitutionLabel,
  getAccountBalance,
  getAccountLabel
} from 'ducks/account/helpers'
import styles from 'ducks/balance/components/BalanceRow.styl'
import tableStyles from 'ducks/balance/components/BalanceTable.styl'
import { filterByDoc } from 'ducks/filters'
import { getGroupBalance } from 'ducks/balance/helpers'
import { getGroupLabel } from 'ducks/groups/helpers'

const sameId = (filteringDoc, accountOrGroup) => {
  return filteringDoc && filteringDoc._id === accountOrGroup._id
}

const isAccountPartOf = (filteringDoc, account) => {
  const accounts = get(filteringDoc, 'accounts.accounts')
  return accounts && account && accounts.indexOf(account._id) > -1
}

class BalanceRow extends React.PureComponent {
  goToTransactionsFilteredByDoc = () => {
    const { account, group } = this.props
    this.props.filterByDoc(account || group)
    this.props.router.push('/transactions')
  }

  render() {
    const {
      t,
      account,
      group,
      warningLimit,
      filteringDoc,
      breakpoints: { isMobile }
    } = this.props

    const balance = account
      ? getAccountBalance(account)
      : getGroupBalance(group)
    const isWarning = balance ? balance < warningLimit : false
    const isAlert = balance ? balance < 0 : false
    const label = account ? getAccountLabel(account) : getGroupLabel(group, t)
    return (
      <tr
        className={cx(styles.BalanceRow, {
          [styles['BalanceRow--selected']]: sameId(
            filteringDoc,
            account || group
          ),
          [styles['BalanceRow--selected-account-from-group']]: isAccountPartOf(
            filteringDoc,
            account
          )
        })}
        onClick={this.goToTransactionsFilteredByDoc}
      >
        <td
          className={cx(tableStyles.ColumnName, {
            [styles.alert]: isAlert,
            [styles.warning]: isWarning
          })}
        >
          {label}
        </td>
        <TdSecondary
          className={cx(tableStyles.ColumnSolde, {
            [styles.alert]: isAlert,
            [styles.warning]: isWarning
          })}
        >
          {balance !== undefined && (
            <Figure
              total={balance}
              warningLimit={warningLimit}
              symbol="€"
              coloredNegative
              coloredWarning
              signed
            />
          )}
        </TdSecondary>
        <TdSecondary className={tableStyles.ColumnAccount}>
          {account && account.number}
          {group &&
            group.accounts.data
              .filter(account => account)
              .map(getAccountLabel)
              .join(', ')}
        </TdSecondary>
        {!isMobile && (
          <TdSecondary className={tableStyles.ColumnBank}>
            {account && getAccountInstitutionLabel(account)}
            {group &&
              uniq(
                group.accounts.data
                  .filter(account => account)
                  .map(getAccountInstitutionLabel)
              ).join(', ')}
          </TdSecondary>
        )}
      </tr>
    )
  }
}

BalanceRow.propTypes = {
  accountOrGroup: props => {
    if (props.group === undefined && props.account === undefined) {
      return new Error('Missing value for account or group. Validation failed.')
    }
  }
}

const mapStateToProps = state => ({
  filteringDoc: getFilteringDoc(state)
})

const mapDispatchToProps = dispatch => ({
  filterByDoc: doc => dispatch(filterByDoc(doc))
})

export default compose(
  translate(),
  withRouter,
  withBreakpoints(),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(BalanceRow)
