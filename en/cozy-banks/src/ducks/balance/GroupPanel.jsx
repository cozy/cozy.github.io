import cx from 'classnames'
import { flowRight as compose } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'

import ExpansionPanel from 'cozy-ui/transpiled/react/MuiCozyTheme/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'

import { translate } from 'cozy-ui/transpiled/react'
import Icon from 'cozy-ui/transpiled/react/Icon'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import { Caption } from 'cozy-ui/transpiled/react/Text'
import Figure from 'cozy-ui/transpiled/react/Figure'
import Switch from 'components/Switch'
import AccountsList from 'ducks/balance/AccountsList'
import withFilters from 'components/withFilters'
import Stack from 'cozy-ui/transpiled/react/Stack'
import Text from 'cozy-ui/transpiled/react/Text'
import {
  getGroupBalance,
  isReimbursementsVirtualGroup
} from 'ducks/groups/helpers'
import styles from 'ducks/balance/GroupPanel.styl'
import { getLateHealthExpenses } from 'ducks/reimbursements/selectors'
import { getSettings } from 'ducks/settings/selectors'
import { getNotificationFromSettings } from 'ducks/settings/helpers'

const GroupPanelSummary = withStyles({
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

const GroupPanelExpandIcon = React.memo(function GroupPanelExpandIcon() {
  return (
    <Icon icon="bottom" className={styles.GroupPanelSummary__icon} width={12} />
  )
})

class GroupPanel extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
    this.handlePanelChange = this.handlePanelChange.bind(this)
  }

  static propTypes = {
    group: PropTypes.object.isRequired,
    filterByDoc: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired,
    switches: PropTypes.object,
    checked: PropTypes.bool,
    expanded: PropTypes.bool.isRequired,
    onSwitchChange: PropTypes.func,
    onChange: PropTypes.func,
    withBalance: PropTypes.bool
  }

  static defaultProps = {
    withBalance: true,
    onSwitchChange: undefined,
    onChange: undefined
  }

  goToGroupDetails = () => {
    const { group, filterByDoc, router } = this.props
    filterByDoc(group)
    router.push('/balances/details')
  }

  handleSummaryContentClick = e => {
    const { group } = this.props

    if (group.loading) return
    e.stopPropagation()
    this.goToGroupDetails()
  }

  handleSwitchClick = e => {
    e.stopPropagation()
  }

  async handlePanelChange(event, expanded) {
    const { group, onChange } = this.props

    // cozy-client does not do optimistic update yet
    // so we have to do it ourselves in the component
    this.setState({
      optimisticExpanded: expanded
    })

    if (onChange) {
      await onChange(group._id, event, expanded)
    }
  }

  render() {
    const {
      group,
      groupLabel,
      switches,
      onSwitchChange,
      checked,
      withBalance,
      t,
      className,
      groupPanelSummaryClasses
    } = this.props

    const groupAccounts = group.accounts.data.filter(Boolean)
    const nbAccounts = groupAccounts.length
    const nbCheckedAccounts = Object.values(switches).filter(s => s.checked)
      .length
    const uncheckedAccountsIds = Object.keys(switches).filter(
      k => !switches[k].checked
    )

    const { optimisticExpanded } = this.state
    const expanded =
      optimisticExpanded !== undefined
        ? optimisticExpanded
        : this.props.expanded
    const isUncheckable = !group.loading

    return (
      <ExpansionPanel
        className={className}
        expanded={expanded}
        onChange={this.handlePanelChange}
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
              onClick={this.handleSummaryContentClick}
            >
              <div className={styles.GroupPanelSummary__label}>
                {groupLabel}
                <br />
                {nbCheckedAccounts < nbAccounts && (
                  <Caption className={styles.GroupPanelSummary__caption}>
                    {t('Balance.nb_accounts', {
                      nbCheckedAccounts,
                      smart_count: nbAccounts
                    })}
                  </Caption>
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
                onClick={this.handleSwitchClick}
                id={`[${group._id}]`}
                onChange={onSwitchChange}
              />
            )}
          </div>
        </GroupPanelSummary>
        <ExpansionPanelDetails>
          {groupAccounts && groupAccounts.length > 0 ? (
            <AccountsList
              group={group}
              switches={switches}
              onSwitchChange={onSwitchChange}
            />
          ) : (
            <Stack className="u-m-1">
              <Text>{t('Balance.no-accounts-in-group.description')}</Text>
              <ButtonLink
                className="u-ml-0"
                href={`#/settings/groups/${group._id}`}
              >
                {t('Balance.no-accounts-in-group.button')}
              </ButtonLink>
            </Stack>
          )}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

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

export const DumbGroupPanel = GroupPanel

export default compose(
  withFilters,
  withRouter,
  translate(),
  connect((state, ownProps) => ({
    groupPanelSummaryClasses: getGroupPanelSummaryClasses(ownProps.group, state)
  }))
)(GroupPanel)
