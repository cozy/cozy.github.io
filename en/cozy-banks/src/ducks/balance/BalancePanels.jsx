import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import PropTypes from 'prop-types'
import GroupPanel from 'ducks/balance/GroupPanel'
import { flowRight as compose } from 'lodash'
import { translate } from 'cozy-ui/transpiled/react'
import { Button } from 'cozy-ui/transpiled/react/Button'
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
              <BalanceAddAccountButton />
            </AddAccountLink>
            <Button
              onClick={this.goToGroupsSettings}
              theme="secondary"
              label={t('Balance.manage_accounts')}
            />
          </div>
        </Delayed>
      </div>
    )
  }
}

export const BalanceAddAccountButton = ({ theme, onClick }) => {
  const { t } = useI18n()
  return (
    <Button onClick={onClick} theme={theme} label={t('Accounts.add_bank')} />
  )
}

BalanceAddAccountButton.defaultProps = {
  theme: 'ghost'
}

export default compose(
  translate(),
  withRouter
)(BalancePanels)
