import React, { useCallback, useState } from 'react'

import groupBy from 'lodash/groupBy'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/MuiCozyTheme/List'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { models } from 'cozy-client'
import DisconnectedAccountModal from 'cozy-harvest-lib/dist/components/DisconnectedAccountModal'
import KonnectorIcon from 'cozy-harvest-lib/dist/components/KonnectorIcon'
import HarvestBankAccountSettings from 'ducks/settings/HarvestBankAccountSettings'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import { AccountIconContainer } from 'components/AccountIcon'
import { Unpadded } from 'components/Padded'
import LegalMention from 'ducks/legal/LegalMention'

import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import UnlinkIcon from 'cozy-ui/transpiled/react/Icons/Unlink'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

const { utils } = models

const AccountListItem = ({ account, onClick, secondary, isLoading }) => {
  return (
    <ListItem button divider onClick={onClick}>
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
        primary={getAccountInstitutionLabel(account)}
        secondary={secondary}
      />
      <ListItemSecondaryAction>
        {isLoading ? (
          <Spinner size="large" className="u-mr-1" />
        ) : (
          <Icon icon={RightIcon} className="u-coolGrey u-mr-1" />
        )}
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

const transformJobsToFakeAccounts = jobsInProgress => {
  const jobsInAccounts = jobsInProgress.map(j => ({
    inProgress: true,
    connection: {
      raw: {
        _id: j.account
      },
      data: j.account
    },
    connectionId: j.account,
    cozyMetadata: {
      createdByApp: j.konnector
    },
    institutionLabel: j.institutionLabel
  }))
  return jobsInAccounts
}

const AccountsListSettings = ({
  accounts: myAccounts = [],
  jobsInProgress
}) => {
  const { t } = useI18n()

  const accounts = [...myAccounts].concat(
    transformJobsToFakeAccounts(jobsInProgress)
  )

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

  const secondary = useCallback(
    (connection, isLoading) => {
      if (connection) {
        if (isLoading) {
          return t('Settings.accounts-tab.import-in-progress')
        }
        return connection.auth.identifier
      } else {
        return (
          <>
            <Icon icon={UnlinkIcon} size="8" className="u-mr-half" />
            {t('Harvest.disconnected-account')}
          </>
        )
      }
    },
    [t]
  )

  return (
    <Unpadded horizontal className={LegalMention.active ? 'u-mv-1' : 'u-mb-1'}>
      {/* Bank accounts still connected to io.cozy.accounts */}
      <List>
        {connectionGroups.map(({ accounts, connection, connectionId }) => {
          const isLoading =
            jobsInProgress.some(j => j.account === connectionId) ||
            accounts[0].inProgress

          return (
            <AccountListItem
              key={accounts[0]._id}
              account={accounts[0]}
              secondary={secondary(connection, isLoading)}
              onClick={() => {
                return setEditionModalOptions({
                  connection: connection,
                  connectionId: connectionId
                })
              }}
              isLoading={isLoading}
            />
          )
        })}
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

export default AccountsListSettings
