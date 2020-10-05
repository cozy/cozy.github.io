import React, { useState } from 'react'

import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import { withRouter } from 'react-router'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { Caption } from 'cozy-ui/transpiled/react/Text'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import {
  queryConnect,
  Q,
  isQueryLoading,
  hasQueryBeenLoaded,
  models
} from 'cozy-client'
import DisconnectedAccountModal from 'cozy-harvest-lib/dist/components/DisconnectedAccountModal'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'

import Loading from 'components/Loading'
import plus from 'assets/icons/16/plus.svg'

import AddAccountLink from 'ducks/settings/AddAccountLink'
import HarvestBankAccountSettings from 'ducks/settings/HarvestBankAccountSettings'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import { useTrackPage } from 'ducks/tracking/browser'

import { accountsConn, APP_DOCTYPE } from 'doctypes'
import { AccountIconContainer } from 'components/AccountIcon'
import { Unpadded } from 'components/Spacing/Padded'

const { utils } = models

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

/**
 * Returns the connection id of an account
 *
 * To achieve backward compatibility of the UI when accounts
 * are not connected to any io.cozy.accounts (since banking
 * connectors historically did not store the io.cozy.accounts
 * in the io.cozy.bank.accounts), the connectionId
 * that is assumed for bank accounts that have not been connected
 * is the konnector slug. This means that every account for
 * a given konnector will be regrouped (instead of being grouped
 * by io.cozy.accounts).
 */
const getConnectionIdFromAccount = account => {
  return account.connection && account.connection.raw
    ? account.connection.raw._id
    : utils.getCreatedByApp(account)
}

export const AccountsList_ = ({ accounts }) => {
  const { t } = useI18n()

  const connectionGroups = Object.values(
    groupBy(accounts, acc => getConnectionIdFromAccount(acc))
  ).map(accounts => ({
    accounts,
    connection: accounts[0].connection.data,
    connectionId: getConnectionIdFromAccount(accounts[0])
  }))

  // Depending on whether the bank account is still connected to an
  // io.cozy.accounts, we will either show the AccountModal or the
  // DisconnectedAccountModal
  const [editionModalOptions, setEditionModalOptions] = useState(null)

  return (
    <Unpadded horizontal className="u-mv-1">
      {/* Bank accounts still connected to io.cozy.accounts */}
      <List>
        {connectionGroups.map(({ accounts, connection, connectionId }) => (
          <AccountListItem
            key={accounts[0]._id}
            account={accounts[0]}
            secondaryText={
              connection ? (
                connection.auth.identifier
              ) : (
                <Caption>
                  <Icon icon="unlink" size="8" className="u-mr-half" />
                  {t('Harvest.disconnected-account')}
                </Caption>
              )
            }
            onClick={() => {
              return setEditionModalOptions({
                connection: connection,
                connectionId: connectionId
              })
            }}
          />
        ))}
      </List>
      {editionModalOptions ? (
        editionModalOptions.connection ? (
          <HarvestBankAccountSettings
            connectionId={editionModalOptions.connection._id}
            onDismiss={() => setEditionModalOptions(null)}
          />
        ) : (
          <DisconnectedAccountModal
            onClose={() => setEditionModalOptions(null)}
            accounts={accounts.filter(
              acc =>
                getConnectionIdFromAccount(acc) ===
                editionModalOptions.connectionId
            )}
          />
        )
      ) : null}
    </Unpadded>
  )
}

const AccountsList = withRouter(AccountsList_)

const AccountsSettings = props => {
  const { t } = useI18n()
  useTrackPage('parametres:comptes')

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
