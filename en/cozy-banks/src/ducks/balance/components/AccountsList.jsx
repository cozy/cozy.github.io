import React from 'react'
import PropTypes from 'prop-types'
import { withClient } from 'cozy-client'
import { sortBy, flowRight as compose } from 'lodash'
import { withRouter } from 'react-router'
import withFilters from 'components/withFilters'
import AccountRow from 'ducks/balance/components/AccountRow'
import styles from 'ducks/balance/components/AccountsList.styl'
import { getAccountBalance } from 'ducks/account/helpers'
import AccountRowLoading from 'ducks/balance/components/AccountRowLoading'
import { connect } from 'react-redux'
import { getHydratedAccountsFromGroup } from 'selectors'

class AccountsList extends React.PureComponent {
  static propTypes = {
    group: PropTypes.object.isRequired,
    switches: PropTypes.object.isRequired,
    onSwitchChange: PropTypes.func
  }

  static defaultProps = {
    onSwitchChange: undefined
  }

  goToAccountsDetails = account => () => {
    const { filterByDoc, router } = this.props

    filterByDoc(account)
    router.push('/balances/details')
  }

  render() {
    const { group, accounts, switches, onSwitchChange } = this.props

    return (
      <ol className={styles.AccountsList}>
        {sortBy(accounts.filter(Boolean), getAccountBalance).map((a, i) => {
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

export default compose(
  withFilters,
  withRouter,
  withClient,
  connect((state, { group, client }) => ({
    accounts: getHydratedAccountsFromGroup(state, group, client)
  }))
)(AccountsList)
