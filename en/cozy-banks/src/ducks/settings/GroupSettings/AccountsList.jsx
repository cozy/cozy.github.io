import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import sortBy from 'lodash/sortBy'

import { useClient, useQuery } from 'cozy-client'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { groupsConn } from 'doctypes'
import Table from 'components/Table'
import { getGroupAccountIds } from 'ducks/groups/helpers'
import { trackEvent } from 'ducks/tracking/browser'
import multiKeyBy from 'utils/multiKeyBy'
import AccountLine from 'ducks/settings/GroupSettings/AccountLine'

import styles from 'ducks/settings/GroupsSettings.styl'

const AccountsList = props => {
  const { t } = useI18n()
  const { accounts, group } = props
  const client = useClient()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoints()

  const toggleAccount = useCallback(
    async (accountId, group, enabled) => {
      const accounts = group.accounts
      if (enabled) {
        accounts.addById(accountId)
      } else {
        accounts.removeById(accountId)
      }
      const res = await client.save(group)
      const doc = res?.data
      if (doc && !group.id) {
        navigate(`/settings/groups/${doc.id}`)
      }
      trackEvent({
        name: `compte-${enabled ? 'activer' : 'desactiver'}`
      })
    },
    [client, navigate]
  )

  const { data: groups } = useQuery(groupsConn.query, groupsConn)
  const groupsByAccountId = useMemo(
    () => multiKeyBy(groups, getGroupAccountIds),
    [groups]
  )

  return accounts.length > 0 ? (
    <Table className={styles.GrpStg__table}>
      <thead>
        <tr>
          <th className={styles.GrpStg__accntLabel}>{t('Groups.label')}</th>
          <th className={styles.GrpStg__accntBank}>{t('Groups.bank')}</th>
          <th className={styles.GrpStg__accntNumber}>
            {t('Groups.account-number')}
          </th>
          {!isMobile ? (
            <th className={styles.GrpStg__accntGroups}>{t('Groups.groups')}</th>
          ) : null}
          <th className={styles.GrpStg__accntToggle}>{t('Groups.included')}</th>
        </tr>
      </thead>
      <tbody>
        {accounts &&
          sortBy(accounts, ['institutionLabel', 'label']).map(account => (
            <AccountLine
              account={account}
              group={group}
              groupsByAccountId={groupsByAccountId}
              toggleAccount={toggleAccount}
              key={account._id}
            />
          ))}
      </tbody>
    </Table>
  ) : (
    <div>
      <Typography variant="body1">{t('Groups.no-account')}</Typography>
    </div>
  )
}

export default React.memo(AccountsList)
