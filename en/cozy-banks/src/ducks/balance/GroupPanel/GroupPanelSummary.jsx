import cx from 'classnames'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import AccordionSummary from 'cozy-ui/transpiled/react/AccordionSummary'
import Box from 'cozy-ui/transpiled/react/Box'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Switch from 'cozy-ui/transpiled/react/Switch'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { getGroupBalance } from 'ducks/groups/helpers'
import { getGroupPanelSummaryClasses } from 'ducks/balance/GroupPanel/helpers'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import styles from 'ducks/balance/GroupPanel/GroupPanel.styl'
import { useFilters } from 'components/withFilters'

const useStyles = makeStyles(theme => ({
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
}))

const GroupPanelSummary = ({
  group,
  groupLabel,
  withBalance,
  switches,
  checked,
  onSwitchChange
}) => {
  const summaryStyles = useStyles()
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const groupPanelSummaryClasses = useSelector(state =>
    getGroupPanelSummaryClasses(group, state)
  )

  const navigate = useNavigate()
  const { filterByDoc } = useFilters()
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

  const groupAccounts = group.accounts.data.filter(Boolean)
  const nbAccounts = groupAccounts.length
  const nbCheckedAccounts = Object.values(switches).filter(
    s => s.checked
  ).length
  const uncheckedAccountsIds = Object.keys(switches).filter(
    k => !switches[k].checked
  )
  const isUncheckable = !group.loading

  return (
    <AccordionSummary
      className={cx({
        summaryStyles,
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
    </AccordionSummary>
  )
}

export { GroupPanelSummary }
