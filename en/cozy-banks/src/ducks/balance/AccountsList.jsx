import React from 'react'
import PropTypes from 'prop-types'
import { withClient } from 'cozy-client'
import { sortBy, flowRight as compose } from 'lodash'
import { withRouter } from 'react-router'
import withFilters from 'components/withFilters'
import AccountRow from 'ducks/balance/AccountRow'
import styles from 'ducks/balance/AccountsList.styl'
import { getAccountBalance } from 'ducks/account/helpers'
import AccountRowLoading from 'ducks/balance/AccountRowLoading'
import { connect } from 'react-redux'
import { getHydratedAccountsFromGroup } from 'selectors'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'

export class DumbAccountsList extends React.PureComponent {
  static propTypes = {
    group: PropTypes.object.isRequired,
    switches: PropTypes.object.isRequired,
    onSwitchChange: PropTypes.func,
    filterByDoc: PropTypes.func.isRequired,
    router: PropTypes.shape({
      push: PropTypes.func
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
    client: PropTypes.object.isRequired
  }

  static defaultProps = {
    onSwitchChange: undefined
  }

  goToAccountsDetails = account => () => {
    const { filterByDoc, router } = this.props

    filterByDoc(account)
    router.push('/balances/details')
  }

  getSortedAccounts() {
    const { group, accounts } = this.props
    const realAccounts = accounts.filter(Boolean)

    if (isReimbursementsVirtualGroup(group)) {
      return realAccounts
    } else {
      return sortBy(realAccounts, getAccountBalance)
    }
  }

  render() {
    const { group, switches, onSwitchChange } = this.props

    return (
      <ol className={styles.AccountsList}>
        {this.getSortedAccounts().map((a, i) => {
          const switchState = switches[a._id]
          return a.loading ? (
            // When loading, a._id is the slug of the connector and can be non-unique, this is why we concat the index
            <AccountRowLoading
              key={i + '_' + a._id}
              konnector={a._id}
              account={a.account}
              status={a.status}
            />
          ) : (
            <AccountRow
              key={a._id}
              account={a}
              group={group}
              onClick={this.goToAccountsDetails(a)}
              checked={switchState.checked}
              disabled={switchState.disabled}
              id={`${group._id}.accounts.${a._id}`}
              onSwitchChange={onSwitchChange}
            />
          )
        })}
      </ol>
    )
  }
}

const AccountsList = compose(
  withFilters,
  withRouter,
  withClient,
  connect((state, { group, client }) => ({
    accounts: getHydratedAccountsFromGroup(state, group, client)
  }))
)(DumbAccountsList)

export default AccountsList
