import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'

import groupBy from 'lodash/groupBy'
import get from 'lodash/get'

import { CozyConfirmDialogProvider } from 'cozy-harvest-lib'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import { models, useAppsInMaintenance, useQuery } from 'cozy-client'
import DisconnectedAccountModal from 'cozy-harvest-lib/dist/components/DisconnectedAccountModal'
import DialogContext from 'cozy-harvest-lib/dist/components/DialogContext'
import HarvestBankAccountSettings from 'ducks/settings/HarvestBankAccountSettings'
import { Unpadded } from 'components/Padded'
import LegalMention from 'ducks/legal/LegalMention'
import UnlinkIcon from 'cozy-ui/transpiled/react/Icons/Unlink'
import { konnectorTriggersConn } from 'doctypes'
import AccountListItem from 'ducks/settings/AccountListItem'
import { getAccountInstitutionLabel } from 'ducks/account/helpers'
import { transformJobsToFakeAccounts } from './helpers/jobs'

const { utils } = models

const wasImportedByBanks = account =>
  account?.metadata?.dateImport != null && account?.metadata?.vendor === 'cozy'

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
    : wasImportedByBanks(account)
    ? getAccountInstitutionLabel(account)
    : utils.getCreatedByApp(account)
}

const AccountsListSettings = ({
  accounts: myAccounts = [],
  jobsInProgress
}) => {
  const { t } = useI18n()
  const appsInMaintenance = useAppsInMaintenance()
  const [konnInError, setKonnInError] = useState([])

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

  const slugInMaintenance = useMemo(
    () => appsInMaintenance.map(appsInMaintenance => appsInMaintenance.slug),
    [appsInMaintenance]
  )

  const triggers = useQuery(konnectorTriggersConn.query, konnectorTriggersConn)

  useEffect(() => {
    const errors =
      triggers?.data
        ?.filter(trigger => get(trigger, 'current_state.status') === 'errored')
        .map(trigger => get(trigger, 'message.account')) || []
    setKonnInError(errors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggers.lastUpdate])

  // Depending on whether the bank account is still connected to an
  // io.cozy.accounts, we will either show the AccountModal or the
  // DisconnectedAccountModal
  const [editionModalOptions, setEditionModalOptions] = useState(null)

  const secondary = useCallback(
    (connection, isAnyJobLoading, isCurrentJobInProgress) => {
      if (connection || isCurrentJobInProgress) {
        if (isAnyJobLoading) {
          return t('Settings.accounts-tab.import-in-progress')
        }
        const isInMaintenance = slugInMaintenance.includes(
          connection?.account_type
        )
        if (isInMaintenance) {
          return t('Settings.accounts-tab.in-maintenance')
        }
        return connection?.auth?.identifier
      } else {
        return (
          <>
            <Icon icon={UnlinkIcon} size="8" className="u-mr-half" />
            {t('Harvest.disconnected-account')}
          </>
        )
      }
    },
    [slugInMaintenance, t]
  )

  const hasError = connection => konnInError.includes(connection?._id)

  const dialogContext = useCozyDialog({
    size: 'l',
    open: true,
    onClose: () => setEditionModalOptions(null),
    disableTitleAutoPadding: true
  })

  return (
    <Unpadded horizontal className={LegalMention.active ? 'u-mv-1' : 'u-mb-1'}>
      {/* Bank accounts still connected to io.cozy.accounts */}
      <List>
        {connectionGroups.map(({ accounts, connection, connectionId }) => {
          const isAnyJobLoading =
            jobsInProgress.some(j => j.account === connectionId) ||
            accounts[0].inProgress
          const isCurrentJobInProgress = accounts?.[0]?.inProgress

          return (
            <AccountListItem
              key={accounts[0]._id}
              account={accounts[0]}
              secondary={secondary(
                connection,
                isAnyJobLoading,
                isCurrentJobInProgress
              )}
              onClick={() => {
                if (isCurrentJobInProgress === true) {
                  return
                }
                return setEditionModalOptions({
                  connection: connection,
                  connectionId: connectionId
                })
              }}
              isAnyJobLoading={isAnyJobLoading}
              hasError={hasError(connection)}
            />
          )
        })}
      </List>
      <CozyConfirmDialogProvider>
        <DialogContext.Provider value={dialogContext}>
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
        </DialogContext.Provider>
      </CozyConfirmDialogProvider>
    </Unpadded>
  )
}

export default AccountsListSettings
