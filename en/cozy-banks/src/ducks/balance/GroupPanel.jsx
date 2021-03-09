import cx from 'classnames'
import PropTypes from 'prop-types'
import React, { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'

import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'

import { useClient } from 'cozy-client'
import ExpansionPanel from 'cozy-ui/transpiled/react/MuiCozyTheme/ExpansionPanel'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import Button, { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Switch from 'cozy-ui/transpiled/react/MuiCozyTheme/Switch'
import AccountsList from 'ducks/balance/AccountsList'
import { useFilters } from 'components/withFilters'
import Stack from 'cozy-ui/transpiled/react/Stack'

import { useRouter } from 'components/RouterContext'
import {
  getGroupBalance,
  isReimbursementsVirtualGroup
} from 'ducks/groups/helpers'
import styles from 'ducks/balance/GroupPanel.styl'
import { getLateHealthExpenses } from 'ducks/reimbursements/selectors'
import { getSettings } from 'ducks/settings/selectors'
import { getNotificationFromSettings } from 'ducks/settings/helpers'
import BottomIcon from 'cozy-ui/transpiled/react/Icons/Bottom'

import Typography from 'cozy-ui/transpiled/react/Typography'

export const GroupPanelSummary = withStyles({
  root: {
    maxHeight: '3.5rem',
    height: '3.5rem'
  },
  content: {
    paddingLeft: '3rem',
    paddingRight: '0',
    height: '100%'
  },
  expanded: {},
  expandIcon: {
    left: '0.375rem',
    right: 'auto',
    transform: 'translateY(-50%) rotate(-90deg)',
    '&$expanded': {
      transform: 'translateY(-50%) rotate(0)'
    }
  }
})(ExpansionPanelSummary)

export const GroupPanelExpandIcon = React.memo(function GroupPanelExpandIcon() {
  return (
    <Icon
      icon={BottomIcon}
      className={styles.GroupPanelSummary__icon}
      width={12}
    />
  )
})

export const getGroupPanelSummaryClasses = (group, state) => {
  if (!isReimbursementsVirtualGroup(group)) {
    return
  }

  const lateHealthExpenses = getLateHealthExpenses(state)
  const hasLateHealthExpenses = lateHealthExpenses.length > 0
  const settings = getSettings(state)
  const lateHealthExpensesNotification = getNotificationFromSettings(
    settings,
    'lateHealthReimbursement'
  )

  if (
    hasLateHealthExpenses &&
    lateHealthExpensesNotification &&
    lateHealthExpensesNotification.enabled
  ) {
    return {
      content: styles['GroupPanelSummary--lateHealthReimbursements']
    }
  }
}

const GroupPanel = props => {
  const {
    group,
    groupLabel,
    onChange,
    expanded: expandedProp,
    switches,
    onSwitchChange,
    checked,
    withBalance,
    className
  } = props
  const router = useRouter()
  const client = useClient()
  const [deleting, setDeleting] = useState(false)
  const [optimisticExpanded, setOptimisticExpanded] = useState(expandedProp)
  const { t } = useI18n()
  const { filterByDoc } = useFilters()
  const groupPanelSummaryClasses = useSelector(state =>
    getGroupPanelSummaryClasses(group, state)
  )
  const goToGroupDetails = useCallback(() => {
    filterByDoc(group)
    router.push('/balances/details')
  }, [group, filterByDoc, router])

  const handleSummaryContentClick = useCallback(
    ev => {
      if (group.loading) return
      ev.stopPropagation()
      goToGroupDetails()
    },
    [goToGroupDetails, group.loading]
  )

  const handleSwitchClick = useCallback(e => {
    e.stopPropagation()
  }, [])

  const handlePanelChange = useCallback(
    async (event, expanded) => {
      // cozy-client does not do optimistic update yet
      // so we have to do it ourselves in the component
      setOptimisticExpanded(expanded)

      if (onChange) {
        await onChange(group._id, event, expanded)
      }
    },
    [onChange, group, setOptimisticExpanded]
  )

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await client.destroy(group)
    } catch (e) {
      setDeleting(false)
    }
  }, [client, group])

  const groupAccounts = group.accounts.data.filter(Boolean)
  const nbAccounts = groupAccounts.length
  const nbCheckedAccounts = Object.values(switches).filter(s => s.checked)
    .length
  const uncheckedAccountsIds = Object.keys(switches).filter(
    k => !switches[k].checked
  )

  const expanded =
    optimisticExpanded !== undefined ? optimisticExpanded : expandedProp
  const isUncheckable = !group.loading

  return (
    <ExpansionPanel
      className={className}
      expanded={expanded}
      onChange={handlePanelChange}
    >
      <GroupPanelSummary
        expandIcon={<GroupPanelExpandIcon />}
        IconButtonProps={{
          disableRipple: true
        }}
        className={cx({
          [styles['GroupPanelSummary--unchecked']]: !checked && isUncheckable
        })}
        classes={groupPanelSummaryClasses}
      >
        <div className={styles.GroupPanelSummary__content}>
          <div
            className={styles.GroupPanelSummary__labelBalanceWrapper}
            onClick={handleSummaryContentClick}
          >
            <div className={styles.GroupPanelSummary__label}>
              {groupLabel}
              <br />
              {nbCheckedAccounts < nbAccounts && (
                <Typography
                  className={styles.GroupPanelSummary__caption}
                  variant="caption"
                  color="textSecondary"
                >
                  {t('Balance.nb-accounts', {
                    nbCheckedAccounts,
                    smart_count: nbAccounts
                  })}
                </Typography>
              )}
            </div>
            {withBalance && (
              <Figure
                className="u-ml-half"
                symbol="€"
                total={getGroupBalance(group, uncheckedAccountsIds)}
                currencyClassName={styles.GroupPanelSummary__figureCurrency}
              />
            )}
          </div>
          {onSwitchChange && (
            <Switch
              disableRipple
              className="u-mh-half"
              checked={checked}
              color="primary"
              onClick={handleSwitchClick}
              id={`[${group._id}]`}
              onChange={onSwitchChange}
            />
          )}
        </div>
      </GroupPanelSummary>
      <ExpansionPanelDetails>
        <div className="u-flex-grow-1 u-maw-100">
          {groupAccounts && groupAccounts.length > 0 ? (
            <AccountsList
              group={group}
              switches={switches}
              onSwitchChange={onSwitchChange}
            />
          ) : (
            <Stack className="u-m-1">
              <Typography variant="body1">
                {t('Balance.no-accounts-in-group.description')}
              </Typography>

              <Media>
                <Bd>
                  <ButtonLink
                    className="u-ml-0"
                    href={`#/settings/groups/${group._id}`}
                  >
                    {t('Balance.no-accounts-in-group.button')}
                  </ButtonLink>
                </Bd>
                <Img>
                  <Button
                    theme="text"
                    busy={deleting}
                    label={t('Groups.delete')}
                    onClick={handleDelete}
                  />
                </Img>
              </Media>
            </Stack>
          )}
        </div>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}

export const DumbGroupPanel = GroupPanel

GroupPanel.propTypes = {
  group: PropTypes.object.isRequired,
  switches: PropTypes.object,
  checked: PropTypes.bool,
  expanded: PropTypes.bool.isRequired,
  onSwitchChange: PropTypes.func,
  onChange: PropTypes.func,
  withBalance: PropTypes.bool
}

GroupPanel.defaultProps = {
  withBalance: true
}

export default GroupPanel
