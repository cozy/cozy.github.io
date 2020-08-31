import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { translate, useI18n } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Table from 'components/Table'
import { groupsConn, accountsConn } from 'doctypes'
import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import Loading from 'components/Loading'
import plus from 'assets/icons/16/plus.svg'
import styles from 'ducks/settings/GroupsSettings.styl'
import { sortBy, flowRight as compose, get } from 'lodash'
import { getGroupLabel } from 'ducks/groups/helpers'
import { Cell, Row } from 'components/Table'

const GroupList = compose(
  withRouter,
  translate()
)(({ groups, router }) => {
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
})

const Groups = withRouter(
  class _Groups extends Component {
    render() {
      const { t, groups, router } = this.props
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
  }
)

export default compose(
  queryConnect({
    groups: groupsConn,
    accounts: accountsConn
  }),
  translate()
)(Groups)
