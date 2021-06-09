import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import sortBy from 'lodash/sortBy'

import { useClient } from 'cozy-client'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import Divider from 'cozy-ui/transpiled/react/MuiCozyTheme/Divider'

import { ACCOUNT_DOCTYPE } from 'doctypes'
import { useFilters } from 'components/withFilters'
import AccountRow from 'ducks/balance/AccountRow'
import { getAccountBalance } from 'ducks/account/helpers'
import AccountRowLoading from 'ducks/balance/AccountRowLoading'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'
import { useRouter } from 'components/RouterContext'

const getSortedAccounts = (group, accounts) => {
  const realAccounts = accounts.filter(Boolean)

  if (isReimbursementsVirtualGroup(group)) {
    return realAccounts
  } else {
    return sortBy(realAccounts, getAccountBalance)
  }
}

export const AccountsList = props => {
  const { group, switches, onSwitchChange, initialVisibleAccounts } = props
  const client = useClient()
  const router = useRouter()
  const { filterByDoc } = useFilters()

  const groupAccounts = useMemo(() => {
    return client.hydrateDocuments(ACCOUNT_DOCTYPE, group.accounts.data)
  }, [group, client])

  const goToAccountsDetails = useCallback(
    (ev, account) => {
      filterByDoc(account)
      router.push('/balances/details')
    },
    [filterByDoc, router]
  )

  const sortedAndFilteredAccounts = useMemo(
    () =>
      getSortedAccounts(group, groupAccounts).filter(a => a.status !== 'done'),
    [group, groupAccounts]
  )

  return (
    <List>
      {sortedAndFilteredAccounts.map((a, i) => {
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
            onClick={goToAccountsDetails}
            checked={switchState.checked}
            disabled={switchState.disabled}
            id={`${group._id}.accounts.${a._id}`}
            onSwitchChange={onSwitchChange}
            initialVisible={initialVisibleAccounts}
          />
        )

        return (
          <React.Fragment key={i}>
            {component}
            {i !== groupAccounts.length - 1 ? (
              <Divider variant="inset" />
            ) : null}
          </React.Fragment>
        )
      })}
    </List>
  )
}

AccountsList.propTypes = {
  group: PropTypes.object.isRequired,
  switches: PropTypes.object.isRequired,
  onSwitchChange: PropTypes.func
}

export default AccountsList
