import React from 'react'
import { keyBy, sortBy } from 'lodash'
import { translate } from 'cozy-ui/react'
import { BalanceAccounts, BalanceGroups } from 'ducks/balance/components'

class BalanceTables extends React.PureComponent {
  render() {
    const { accounts, balanceLower, groups, t } = this.props

    const accountsSorted = sortBy(accounts, ['institutionLabel', 'label'])
    const groupsSorted = sortBy(
      groups.map(group => ({
        ...group,
        label: group.virtual
          ? t(`Data.accountTypes.${group.label}`)
          : group.label
      })),
      group => group.label
    )

    const groupsC = (
      <BalanceGroups
        accountsById={keyBy(accounts, x => x._id)}
        groups={groupsSorted}
        balanceLower={balanceLower}
      />
    )

    return (
      <React.Fragment>
        {groupsSorted.length > 0 && groupsC}
        <BalanceAccounts
          accounts={accountsSorted}
          balanceLower={balanceLower}
        />
        {groupsSorted.length === 0 && groupsC}
      </React.Fragment>
    )
  }
}

export default translate()(BalanceTables)
