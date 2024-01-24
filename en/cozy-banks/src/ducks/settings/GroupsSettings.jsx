import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import get from 'lodash/get'
import sortBy from 'lodash/sortBy'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import { groupsConn, accountsConn } from 'doctypes'
import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'

import Table, { Cell, Row } from 'components/Table'
import Loading from 'components/Loading'
import styles from 'ducks/settings/GroupsSettings.styl'
import { getGroupLabel } from 'ducks/groups/helpers'
import { useTrackPage } from 'ducks/tracking/browser'
import LegalMention from 'ducks/legal/LegalMention'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const GroupList = ({ groups }) => {
  const navigate = useNavigate()
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
            onClick={() => navigate(`/settings/groups/${group._id}`)}
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
    <Typography variant="body1">{t('Groups.no-groups')}</Typography>
  )
}

const Groups = props => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoints()
  useTrackPage('parametres:groupes')

  const { groups } = props

  const sortedGroups = useMemo(
    () =>
      sortBy(
        groups.data.filter(x => x),
        group => getGroupLabel(group, t)
      ),
    [groups.data, t]
  )

  if (isQueryLoading(groups) && !hasQueryBeenLoaded(groups)) {
    return <Loading />
  }

  return (
    <div
      className={LegalMention.active ? (isMobile ? 'u-mv-1' : '') : 'u-mb-1'}
    >
      <GroupList groups={sortedGroups} />
      <p>
        <Button
          color="primary"
          theme="text"
          onClick={() => navigate('/settings/groups/new')}
        >
          <Icon icon={PlusIcon} className="u-mr-half" /> {t('Groups.create')}
        </Button>
      </p>
    </div>
  )
}

export default queryConnect({
  groups: groupsConn,
  accounts: accountsConn
})(Groups)
