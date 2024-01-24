import React, { memo } from 'react'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'

import { hasQueryBeenLoaded, isQueryLoading, useQuery } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

import { accountsConn } from 'doctypes'
import Loading from 'components/Loading'
import { useTrackPage } from 'ducks/tracking/browser'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { useBanksContext } from 'ducks/context/BanksContext'
import AccountsListSettings from 'ducks/settings/AccountsListSettings'

const AccountsSettings = () => {
  const { t } = useI18n()
  useTrackPage('parametres:comptes')

  const accountsCollection = useQuery(accountsConn.query, accountsConn)
  const { jobsInProgress = [], hasJobsInProgress } = useBanksContext()

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
      {myAccounts || hasJobsInProgress ? (
        <AccountsListSettings
          accounts={myAccounts}
          jobsInProgress={jobsInProgress}
          t={t}
        />
      ) : (
        <p>{t('Accounts.no-accounts')}</p>
      )}
      <AddAccountLink>
        <Button
          variant="text"
          startIcon={<Icon icon={PlusIcon} />}
          label={t('Accounts.add-bank')}
        />
      </AddAccountLink>
    </>
  )
}

export default memo(AccountsSettings)
