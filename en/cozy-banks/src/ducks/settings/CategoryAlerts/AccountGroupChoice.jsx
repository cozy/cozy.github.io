import React from 'react'
import PropTypes from 'prop-types'
import { queryConnect } from 'cozy-client'
import { accountsConn, groupsConn } from 'doctypes'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import AccountIcon from 'components/AccountIcon'
import { getGroupLabel } from 'ducks/groups/helpers'
import { getAccountLabel } from 'ducks/account/helpers.js'
import {
  DialogSection,
  DialogSections,
  DialogListItem
} from 'components/DialogSections'
import List from 'cozy-ui/transpiled/react/List'

/**
 * Displays Rows to select among either
 *
 * - all accounts
 * - an account
 * - a group
 */
export const AccountGroupChoice = ({
  current,
  accounts: accountsCol,
  groups: groupsCol,
  onSelect,
  canSelectAll,
  filter
}) => {
  const { t } = useI18n()
  const unfilteredAccounts = accountsCol.data || []
  const unfilteredGroups = groupsCol.data || []

  const accounts = filter
    ? unfilteredAccounts.filter(filter)
    : unfilteredAccounts
  const groups = filter ? unfilteredGroups.filter(filter) : unfilteredGroups

  return (
    <DialogSections>
      {canSelectAll ? (
        <DialogSection>
          <List>
            <DialogListItem
              label={t('AccountSwitch.all-accounts')}
              hasRadio
              isSelected={!current}
              onClick={() => onSelect(null)}
            />
          </List>
        </DialogSection>
      ) : null}
      {accounts.length > 0 ? (
        <DialogSection label={t('AccountSwitch.accounts')}>
          <List>
            {accounts.map(account => (
              <DialogListItem
                divider
                icon={<AccountIcon account={account} />}
                key={account._id}
                isSelected={current && current._id === account._id}
                hasRadio
                label={getAccountLabel(account, t)}
                onClick={() => onSelect(account)}
              />
            ))}
          </List>
        </DialogSection>
      ) : null}
      {groups.length > 0 ? (
        <DialogSection label={t('AccountSwitch.groups')}>
          <List>
            {groups.map(group => (
              <DialogListItem
                divider
                key={group._id}
                isSelected={current && current._id === group._id}
                hasRadio
                label={getGroupLabel(group, t)}
                onClick={() => onSelect(group)}
              />
            ))}
          </List>
        </DialogSection>
      ) : null}
    </DialogSections>
  )
}

AccountGroupChoice.propTypes = {
  onSelect: PropTypes.func.isRequired
}

AccountGroupChoice.defaultProps = {
  canSelectAll: true
}

export const DumbAccountGroupChoice = AccountGroupChoice

export default queryConnect({
  accounts: accountsConn,
  groups: groupsConn
})(DumbAccountGroupChoice)
