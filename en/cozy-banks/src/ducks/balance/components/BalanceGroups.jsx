import React from 'react'
import { withRouter } from 'react-router'
import cx from 'classnames'
import { flowRight as compose } from 'lodash'
import { translate } from 'cozy-ui/react'
import Button from 'cozy-ui/react/Button'

import btnStyles from 'styles/buttons.styl'

import BalanceTable from 'ducks/balance/components/BalanceTable'
import BalanceRow from 'ducks/balance/components/BalanceRow'

class BalanceGroups extends React.PureComponent {
  render() {
    const { groups, accountsById, balanceLower, t, router } = this.props
    const names = [
      t('Groups.label'),
      t('Groups.total-balance'),
      t('Groups.accounts'),
      t('Groups.banks')
    ]

    return (
      <div>
        <h3>{t('AccountSwitch.groups')}</h3>
        {groups.length !== 0 && (
          <BalanceTable names={names}>
            {groups.map(group => (
              <BalanceRow
                getAccount={id => accountsById[id]}
                key={group.label}
                group={group}
                warningLimit={balanceLower}
              />
            ))}
          </BalanceTable>
        )}
        {groups.length === 0 ? (
          <p>
            {t('Groups.no-groups')}
            <br />
            <Button
              onClick={() => router.push('/settings/groups/new')}
              className={cx(btnStyles['btn--no-outline'], 'u-pv-1')}
              label={t('Groups.create')}
              icon="plus"
            />
          </p>
        ) : (
          <p>
            <Button
              onClick={() => router.push('/settings/groups')}
              className={cx(btnStyles['btn--no-outline'], 'u-pv-1')}
              label={t('Groups.manage-groups')}
            />
          </p>
        )}
      </div>
    )
  }
}

export default compose(
  withRouter,
  translate()
)(BalanceGroups)
