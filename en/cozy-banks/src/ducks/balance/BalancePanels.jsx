import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import flag from 'cozy-flags'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

import Delayed from 'components/Delayed'
import AddAccountLink from 'ducks/settings/AddAccountLink'
import { GroupPanel } from 'ducks/balance/GroupPanel/GroupPanel'
import { translateAndSortGroups } from 'ducks/groups/helpers'
import styles from 'ducks/balance/BalancePanels.styl'

const GROUP_PANEL_RENDER_DELAY = 150

const BalancePanels = ({
  groups,
  panelsState,
  onSwitchChange,
  onPanelChange,
  withBalance
}) => {
  const { t } = useI18n()
  const navigate = useNavigate()

  const goToGroupsSettings = useCallback(() => {
    navigate('/settings/groups')
  }, [navigate])

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
            initialVisibleAccounts={i < 2}
          />
        </Delayed>
      ))}
      <Delayed delay={groupsSorted.length * GROUP_PANEL_RENDER_DELAY}>
        <div className={styles.BalancePanels__actions}>
          <AddAccountLink>
            <BalanceAddAccountButton />
          </AddAccountLink>
          <Button
            onClick={goToGroupsSettings}
            theme="secondary"
            label={t('Balance.manage-accounts')}
          />
        </div>
      </Delayed>
    </div>
  )
}

BalancePanels.propTypes = {
  groups: PropTypes.arrayOf(PropTypes.object).isRequired,
  panelsState: PropTypes.object.isRequired,
  onSwitchChange: PropTypes.func,
  onPanelChange: PropTypes.func,
  withBalance: PropTypes.bool
}

BalancePanels.defaultProps = {
  withBalance: true,
  onSwitchChange: undefined,
  onPanelChange: undefined
}

export const BalanceAddAccountButton = ({ theme, onClick }) => {
  const { t } = useI18n()
  return (
    <Button onClick={onClick} theme={theme} label={t('Accounts.add-bank')} />
  )
}

BalanceAddAccountButton.defaultProps = {
  theme: 'ghost'
}

export default React.memo(BalancePanels)
