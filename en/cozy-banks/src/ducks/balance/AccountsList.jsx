import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import sortBy from 'lodash/sortBy'

import { useClient, useQuery } from 'cozy-client'
import List from 'cozy-ui/transpiled/react/List'
import Divider from 'cozy-ui/transpiled/react/Divider'

import { ACCOUNT_DOCTYPE, konnectorTriggersConn } from 'doctypes'
import { useFilters } from 'components/withFilters'
import AccountRow from 'ducks/balance/AccountRow'
import { getAccountBalance } from 'ducks/account/helpers'
import AccountRowLoading from 'ducks/balance/AccountRowLoading'
import { isReimbursementsVirtualGroup } from 'ducks/groups/helpers'

const getSortedAccounts = (group, accounts) => {
  const realAccounts = accounts.filter(Boolean)

  if (isReimbursementsVirtualGroup(group)) {
    return realAccounts
  } else {
    return sortBy(realAccounts, getAccountBalance)
  }
}

const AccountsList = props => {
  const { group, switches, onSwitchChange, initialVisibleAccounts } = props
  const client = useClient()
  const navigate = useNavigate()
  const { filterByDoc } = useFilters()

  const groupAccounts = useMemo(() => {
    return client.hydrateDocuments(ACCOUNT_DOCTYPE, group.accounts.data)
  }, [group, client])

  const goToAccountsDetails = useCallback(
    (ev, account) => {
      filterByDoc(account)
      navigate('/balances/details')
    },
    [filterByDoc, navigate]
  )

  const sortedAndFilteredAccounts = useMemo(
    () =>
      getSortedAccounts(group, groupAccounts).filter(a => a.status !== 'done'),
    [group, groupAccounts]
  )
  const { data: triggers } = useQuery(
    konnectorTriggersConn.query,
    konnectorTriggersConn
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
            triggers={triggers}
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

const MemoizedAccountsList = React.memo(props => {
  return <AccountsList {...props} />
})
export default MemoizedAccountsList
