import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { translate } from 'cozy-ui/react'
import Button from 'cozy-ui/react/Button'
import Icon from 'cozy-ui/react/Icon'
import Table from 'components/Table'
import { groupsConn, accountsConn } from 'doctypes'
import { queryConnect } from 'cozy-client'
import Loading from 'components/Loading'
import plus from 'assets/icons/16/plus.svg'
import styles from 'ducks/settings/GroupsSettings.styl'
import btnStyles from 'styles/buttons.styl'
import { sortBy, flowRight as compose, get } from 'lodash'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { getGroupLabel } from 'ducks/groups/helpers'

const GroupList = compose(
  withRouter,
  translate()
)(({ groups, t, router }) => {
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
          <tr
            key={group._id}
            onClick={() => router.push(`/settings/groups/${group._id}`)}
            className={styles.GrpsStg__row}
          >
            <td className={styles.GrpsStg__label}>{getGroupLabel(group, t)}</td>
            <td className={styles.GrpsStg__accounts}>
              {group.accounts.data
                .map(
                  account => get(account, 'shortLabel') || get(account, 'label')
                )
                .filter(Boolean)
                .join(', ')}
            </td>
          </tr>
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
      if (isCollectionLoading(groups) && !hasBeenLoaded(groups)) {
        return <Loading />
      }

      return (
        <div>
          <GroupList groups={sortBy(groups.data.filter(x => x), 'label')} />
          <p>
            <Button
              icon={<Icon icon={plus} className="u-mr-half" />}
              label={t('Groups.create')}
              className={btnStyles['btn--no-outline']}
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
