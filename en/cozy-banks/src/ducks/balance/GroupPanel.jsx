import cx from 'classnames'
import PropTypes from 'prop-types'
import React, { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import AccordionSummary from 'cozy-ui/transpiled/react/MuiCozyTheme/AccordionSummary'
import AccordionDetails from 'cozy-ui/transpiled/react/MuiCozyTheme/AccordionDetails'
import Box from 'cozy-ui/transpiled/react/Box'

import { useClient } from 'cozy-client'
import { withStyles } from 'cozy-ui/transpiled/react/styles'
import Accordion from 'cozy-ui/transpiled/react/MuiCozyTheme/Accordion'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { Media, Bd, Img } from 'cozy-ui/transpiled/react/Media'
import Button, { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Switch from 'cozy-ui/transpiled/react/MuiCozyTheme/Switch'
import AccountsList from 'ducks/balance/AccountsList'
import { useFilters } from 'components/withFilters'
import Stack from 'cozy-ui/transpiled/react/Stack'

import {
  getGroupBalance,
  isReimbursementsVirtualGroup
} from 'ducks/groups/helpers'
import styles from 'ducks/balance/GroupPanel.styl'
import { getLateHealthExpenses } from 'ducks/reimbursements/selectors'
import { getSettings } from 'ducks/settings/selectors'
import { getNotificationFromSettings } from 'ducks/settings/helpers'

import Typography from 'cozy-ui/transpiled/react/Typography'

const GroupPanelSummary = withStyles(theme => ({
  root: {},
  expandIcon: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(0),
    color: theme.palette.grey[400]
  },
  expanded: {},
  content: {
    marginTop: 0,
    marginBottom: 0,
    paddingRight: 0,
    alignItems: 'stretch',
    // Do not put align-items: stretch on the root otherwise the expand icon
    // has the wrong size. Here, only the label takes all the vertical space.
    alignSelf: 'stretch',
    '&$expanded': {
      marginTop: 0,
      marginBottom: 0,
      paddingRight: 0
    }
  }
}))(AccordionSummary)

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
      root: styles['GroupPanelSummary--lateHealthReimbursements']
    }
  }
}

const NoTransition = props => {
  const { in: open, children } = props
  if (open) {
    return children
  } else {
    return null
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
    className,
    initialVisibleAccounts
  } = props
  const navigate = useNavigate()
  const client = useClient()
  const [deleting, setDeleting] = useState(false)
  const [optimisticExpanded, setOptimisticExpanded] = useState(expandedProp)
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const { filterByDoc } = useFilters()
  const groupPanelSummaryClasses = useSelector(state =>
    getGroupPanelSummaryClasses(group, state)
  )
  const goToGroupDetails = useCallback(() => {
    filterByDoc(group)
    navigate('/balances/details')
  }, [group, filterByDoc, navigate])

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
  const nbCheckedAccounts = Object.values(switches).filter(
    s => s.checked
  ).length
  const uncheckedAccountsIds = Object.keys(switches).filter(
    k => !switches[k].checked
  )

  const expanded =
    optimisticExpanded !== undefined ? optimisticExpanded : expandedProp
  const isUncheckable = !group.loading

  return (
    <Accordion
      className={className}
      expanded={expanded}
      onChange={handlePanelChange}
      TransitionComponent={NoTransition}
    >
      <GroupPanelSummary
        className={cx({
          [styles['GroupPanelSummary--unchecked']]: !checked && isUncheckable
        })}
        classes={groupPanelSummaryClasses}
      >
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
        <Box display="flex" alignItems="center">
          {onSwitchChange && (
            <Switch
              disableRipple
              className={!isMobile ? 'u-mr-half' : null}
              checked={checked}
              color="primary"
              onClick={handleSwitchClick}
              id={`[${group._id}]`}
              onChange={onSwitchChange}
            />
          )}
        </Box>
      </GroupPanelSummary>
      <AccordionDetails>
        <div className="u-flex-grow-1 u-maw-100">
          {groupAccounts && groupAccounts.length > 0 ? (
            <AccountsList
              group={group}
              switches={switches}
              onSwitchChange={onSwitchChange}
              initialVisibleAccounts={initialVisibleAccounts}
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
      </AccordionDetails>
    </Accordion>
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

export default React.memo(GroupPanel)
