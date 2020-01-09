import React from 'react'
import PropTypes from 'prop-types'
import GroupPanel from 'ducks/balance/components/GroupPanel'
import { flowRight as compose } from 'lodash'
import { translate } from 'cozy-ui/transpiled/react'
import ButtonAction from 'cozy-ui/transpiled/react/ButtonAction'
import { withRouter } from 'react-router'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { translateAndSortGroups } from 'ducks/groups/helpers'
import styles from 'ducks/balance/BalancePanels.styl'
import Delayed from 'components/Delayed'
import flag from 'cozy-flags'

const GROUP_PANEL_RENDER_DELAY = 150

class BalancePanels extends React.PureComponent {
  static propTypes = {
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    router: PropTypes.object.isRequired,
    warningLimit: PropTypes.number.isRequired,
    panelsState: PropTypes.object.isRequired,
    onSwitchChange: PropTypes.func,
    onPanelChange: PropTypes.func,
    withBalance: PropTypes.bool
  }

  static defaultProps = {
    withBalance: true,
    onSwitchChange: undefined,
    onPanelChange: undefined
  }

  goToGroupsSettings = () => this.props.router.push('/settings/groups')

  render() {
    const {
      groups,
      t,
      warningLimit,
      panelsState,
      onSwitchChange,
      onPanelChange,
      withBalance
    } = this.props

    const groupsSorted = translateAndSortGroups(groups, t)
    const groupPanelDelay = flag('balance.no-delay-groups')
      ? 0
      : GROUP_PANEL_RENDER_DELAY

    return (
      <div className={styles.BalancePanels}>
        {groupsSorted.map(({ group, label }, i) => (
          <Delayed key={group._id} delay={i * groupPanelDelay}>
            {/* ^ Delay rendering of group panels after the first two */}
            <GroupPanel
              className={
                flag('balance.no-delay-groups') ? '' : 'u-fx-from-bottom'
              }
              group={group}
              groupLabel={label}
              warningLimit={warningLimit}
              expanded={panelsState[group._id].expanded}
              checked={panelsState[group._id].checked}
              switches={panelsState[group._id].accounts}
              onSwitchChange={onSwitchChange}
              onChange={onPanelChange}
              withBalance={withBalance}
            />
          </Delayed>
        ))}
        <Delayed delay={groupsSorted.length * GROUP_PANEL_RENDER_DELAY}>
          <div className={styles.BalancePanels__actions}>
            <AddAccountLink>
              <ButtonAction
                type="new"
                label={t('Accounts.add_bank')}
                className={styles.BalancePanels__action}
              />
            </AddAccountLink>
            <ButtonAction
              onClick={this.goToGroupsSettings}
              type="normal"
              label={t('Balance.manage_accounts')}
              className={styles.BalancePanels__action}
            />
          </div>
        </Delayed>
      </div>
    )
  }
}

export default compose(
  translate(),
  withRouter
)(BalancePanels)
