import React from 'react'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'

import { useI18n } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { groupsConn, accountsConn } from 'doctypes'
import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'

import Table, { Cell, Row } from 'components/Table'
import Loading from 'components/Loading'
import plus from 'assets/icons/16/plus.svg'
import styles from 'ducks/settings/GroupsSettings.styl'
import { useRouter } from 'components/RouterContext'
import { getGroupLabel } from 'ducks/groups/helpers'
import { useTrackPage } from 'ducks/tracking/browser'

const GroupList = ({ groups }) => {
  const router = useRouter()
  const { t } = useI18n()
  return groups.length ? (
    <Table className={styles.GrpsStg__table}>
      <thead>
        <tr>
          <th className={styles.GrpsStg__label}>{t('Groups.label')}</th>
          <th className={styles.GrpsStg__accounts}>{t('Groups.accounts')}</th>
        </tr>
      </thead>

      <tbody>
        {groups.map(group => (
          <Row
            nav
            key={group._id}
            onClick={() => router.push(`/settings/groups/${group._id}`)}
          >
            <Cell main className={styles.GrpsStg__label}>
              {getGroupLabel(group, t)}
            </Cell>
            <Cell className={styles.GrpsStg__accounts}>
              {group.accounts.data
                .map(
                  account => get(account, 'shortLabel') || get(account, 'label')
                )
                .filter(Boolean)
                .join(', ')}
            </Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  ) : (
    <p>{t('Groups.no-groups')}</p>
  )
}

const Groups = props => {
  const { t } = useI18n()
  const router = useRouter()

  useTrackPage('parametres:groupes')

  const { groups } = props
  if (isQueryLoading(groups) && !hasQueryBeenLoaded(groups)) {
    return <Loading />
  }

  return (
    <div>
      <GroupList groups={sortBy(groups.data.filter(x => x), 'label')} />
      <p>
        <Button
          icon={<Icon icon={plus} className="u-mr-half" />}
          label={t('Groups.create')}
          theme="text"
          onClick={() => router.push('/settings/groups/new')}
        />
      </p>
    </div>
  )
}

export default queryConnect({
  groups: groupsConn,
  accounts: accountsConn
})(Groups)
