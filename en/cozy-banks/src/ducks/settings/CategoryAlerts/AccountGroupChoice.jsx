import React from 'react'
import PropTypes from 'prop-types'
import { queryConnect } from 'cozy-client'
import { accountsConn, groupsConn } from 'doctypes'
import { translate } from 'cozy-ui/transpiled/react'
import AccountIcon from 'components/AccountIcon'
import { getGroupLabel } from 'ducks/groups/helpers'
import { getAccountLabel } from 'ducks/account/helpers.js'
import { ModalSection, ModalSections, ModalRow } from 'components/ModalSections'

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
  t
}) => {
  const accounts = accountsCol.data || []
  const groups = groupsCol.data || []
  return (
    <ModalSections>
      <ModalSection>
        <ModalRow
          label={t('AccountSwitch.all_accounts')}
          hasRadio
          isSelected={!current}
          onClick={() => onSelect(null)}
        />
      </ModalSection>
      <ModalSection label={t('AccountSwitch.accounts')}>
        {accounts.map(account => (
          <ModalRow
            icon={<AccountIcon account={account} />}
            key={account._id}
            isSelected={current && current._id === account._id}
            hasRadio
            label={getAccountLabel(account)}
            onClick={() => onSelect(account)}
          />
        ))}
      </ModalSection>
      <ModalSection label={t('AccountSwitch.groups')}>
        {groups.map(group => (
          <ModalRow
            key={group._id}
            isSelected={current && current._id === group._id}
            hasRadio
            label={getGroupLabel(group, t)}
            onClick={() => onSelect(group)}
          />
        ))}
      </ModalSection>
    </ModalSections>
  )
}

AccountGroupChoice.propTypes = {
  onSelect: PropTypes.func.isRequired
}

export const DumbAccountGroupChoice = translate()(AccountGroupChoice)

export default queryConnect({
  accounts: accountsConn,
  groups: groupsConn
})(DumbAccountGroupChoice)
