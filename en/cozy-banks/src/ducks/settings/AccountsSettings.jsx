import React, { useState } from 'react'

import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import { withRouter } from 'react-router'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import {
  queryConnect,
  Q,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'

import Loading from 'components/Loading'
import plus from 'assets/icons/16/plus.svg'

import AddAccountLink from 'ducks/settings/AddAccountLink'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import KonnectorIcon from 'ducks/balance/KonnectorIcon'

import { accountsConn, APP_DOCTYPE } from 'doctypes'
import { AccountIconContainer } from 'components/AccountIcon'
import { Unpadded } from 'components/Spacing/Padded'

import HarvestBankAccountSettings from './HarvestBankAccountSettings'
import DisconnectedAccountModal from 'cozy-harvest-lib/dist/components/DisconnectedAccountModal'

const AccountListItem = ({ account, onClick, secondaryText }) => {
  return (
    <ListItem onClick={onClick} className="u-c-pointer">
      <ListItemIcon>
        <AccountIconContainer>
          <KonnectorIcon
            style={{ width: 16, height: 16 }}
            konnectorSlug={
              account.cozyMetadata ? account.cozyMetadata.createdByApp : null
            }
          />
        </AccountIconContainer>
      </ListItemIcon>
      <ListItemText
        primaryText={getAccountInstitutionLabel(account)}
        secondaryText={secondaryText}
      />
      <ListItemSecondaryAction>
        <Icon icon="right" className="u-coolGrey u-mr-1" />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const AccountsList_ = ({ accounts }) => {
  const connectionGroups = Object.values(
    groupBy(accounts, acc => acc.connection.raw.id)
  ).map(accounts => ({
    accounts,
    connection: accounts[0].connection.data
  }))

  // Depending on whether the bank account is still connected to an
  // io.cozy.accounts, we will either show the AccountModal or the
  // DisconnectedAccountModal
  const [connectionId, setConnectionIdShownInSettings] = useState(null)
  const [accountsBeingEdited, setAccountsBeingEdited] = useState(null)

  return (
    <Unpadded horizontal className="u-mv-1">
      {/* Bank accounts still connected to io.cozy.accounts */}
      <List>
        {connectionGroups.map(({ accounts, connection }) => (
          <AccountListItem
            key={accounts[0]._id}
            account={accounts[0]}
            secondaryText={connection ? connection.auth.identifier : null}
            onClick={() => {
              return connection
                ? setConnectionIdShownInSettings(connection.id)
                : setAccountsBeingEdited(accounts)
            }}
          />
        ))}
      </List>
      {connectionId ? (
        <HarvestBankAccountSettings
          connectionId={connectionId}
          onDismiss={() => setConnectionIdShownInSettings(null)}
        />
      ) : null}
      {accountsBeingEdited ? (
        <DisconnectedAccountModal
          onClose={() => setAccountsBeingEdited(null)}
          accounts={accountsBeingEdited}
        />
      ) : null}
    </Unpadded>
  )
}

const AccountsList = withRouter(AccountsList_)

const AccountsSettings = props => {
  const { t } = useI18n()
  const { accountsCollection } = props

  if (
    isQueryLoading(accountsCollection) &&
    !hasQueryBeenLoaded(accountsCollection)
  ) {
    return <Loading />
  }

  const sortedAccounts = sortBy(accountsCollection.data, [
    'institutionLabel',
    'label'
  ])
  const accountBySharingDirection = groupBy(sortedAccounts, account => {
    return account.shared === undefined
  })

  const myAccounts = accountBySharingDirection[true]

  return (
    <>
      {myAccounts ? (
        <AccountsList accounts={myAccounts} t={t} />
      ) : (
        <p>{t('Accounts.no-accounts')}</p>
      )}
      <AddAccountLink>
        <Button
          theme="text"
          icon={<Icon icon={plus} className="u-mr-half" />}
          label={t('Accounts.add_bank')}
        />
      </AddAccountLink>
    </>
  )
}
export default queryConnect({
  accountsCollection: accountsConn,
  apps: { query: () => Q(APP_DOCTYPE), as: 'apps' }
})(AccountsSettings)
