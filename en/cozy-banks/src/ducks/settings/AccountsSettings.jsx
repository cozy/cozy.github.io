import React from 'react'

import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/MuiCozyTheme/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import {
  hasQueryBeenLoaded,
  isQueryLoading,
  Q,
  queryConnect
} from 'cozy-client'

import Loading from 'components/Loading'

import AddAccountLink from 'ducks/settings/AddAccountLink'
import { useTrackPage } from 'ducks/tracking/browser'

import { accountsConn, APP_DOCTYPE } from 'doctypes'
import { useJobsContext } from 'components/JobsContext'
import AccountsListSettings from 'ducks/settings/AccountsListSettings'

const AccountsSettings = props => {
  const { t } = useI18n()
  useTrackPage('parametres:comptes')

  const { accountsCollection } = props
  const { jobsInProgress = [] } = useJobsContext()

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
      {myAccounts || jobsInProgress.length > 0 ? (
        <AccountsListSettings
          accounts={myAccounts}
          jobsInProgress={jobsInProgress}
          t={t}
        />
      ) : (
        <p>{t('Accounts.no-accounts')}</p>
      )}
      <AddAccountLink>
        <Button color="primary">
          <Icon icon={PlusIcon} className="u-mr-half" />{' '}
          {t('Accounts.add-bank')}
        </Button>
      </AddAccountLink>
    </>
  )
}
export default queryConnect({
  accountsCollection: accountsConn,
  apps: { query: () => Q(APP_DOCTYPE), as: 'apps' }
})(AccountsSettings)
