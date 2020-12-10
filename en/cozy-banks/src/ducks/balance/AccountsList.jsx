import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useClient } from 'cozy-client'
import sortBy from 'lodash/sortBy'
import { useSelector } from 'react-redux'

import withFilters from 'components/withFilters'
import AccountRow from 'ducks/balance/AccountRow'
import { getAccountBalance } from 'ducks/account/helpers'
import AccountRowLoading from 'ducks/balance/AccountRowLoading'
import { getHydratedAccountsFromGroup } from 'selectors'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'
import { useRouter } from 'components/RouterContext'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'

const getSortedAccounts = (group, accounts) => {
  const realAccounts = accounts.filter(Boolean)

  if (isReimbursementsVirtualGroup(group)) {
    return realAccounts
  } else {
    return sortBy(realAccounts, getAccountBalance)
  }
}

const mkAccountsSelector = (group, client) => state =>
  getHydratedAccountsFromGroup(state, group, client)

export const DumbAccountsList = props => {
  const client = useClient()
  const router = useRouter()
  const { group, filterByDoc, switches, onSwitchChange } = props
  const accounts = useSelector(mkAccountsSelector(group, client))

  const goToAccountsDetails = useCallback(
    account => {
      filterByDoc(account)
      router.push('/balances/details')
    },
    [filterByDoc, router]
  )

  return (
    <List>
      {getSortedAccounts(group, accounts).map((a, i) => {
        const switchState = switches[a._id]
        const component = a.loading ? (
          // When loading, a._id is the slug of the connector and can be non-unique, this is why we concat the index
          <AccountRowLoading
            key={i + '_' + a._id}
            konnectorSlug={a._id}
            account={a.account}
            status={a.status}
          />
        ) : (
          <AccountRow
            key={a._id}
            account={a}
            group={group}
            onClick={() => goToAccountsDetails(a)}
            checked={switchState.checked}
            disabled={switchState.disabled}
            id={`${group._id}.accounts.${a._id}`}
            onSwitchChange={onSwitchChange}
          />
        )

        return (
          <>
            {component}
            {i !== accounts.length - 1 ? <Divider variant="inset" /> : null}
          </>
        )
      })}
    </List>
  )
}

DumbAccountsList.propTypes = {
  group: PropTypes.object.isRequired,
  switches: PropTypes.object.isRequired,
  onSwitchChange: PropTypes.func,
  filterByDoc: PropTypes.func.isRequired
}

DumbAccountsList.defaultProps = {
  onSwitchChange: undefined
}

const AccountsList = withFilters(DumbAccountsList)

export default AccountsList
