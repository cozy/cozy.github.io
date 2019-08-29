import cx from 'classnames'
import { flowRight as compose } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { withRouter } from 'react-router'

import ExpansionPanel from 'cozy-ui/react/MuiCozyTheme/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import { withStyles } from '@material-ui/core/styles'

import { translate } from 'cozy-ui/react'
import Icon from 'cozy-ui/react/Icon'
import { Caption } from 'cozy-ui/react/Text'
import { Figure } from 'components/Figure'
import Switch from 'components/Switch'
import AccountsList from 'ducks/balance/components/AccountsList'
import withFilters from 'components/withFilters'

import { getGroupBalance } from 'ducks/balance/helpers'
import styles from 'ducks/balance/components/GroupPanel.styl'

const GroupPanelSummary = withStyles(() => ({
  expanded: {},
  root: {
    maxHeight: '3.5rem',
    height: '3.5rem'
  },
  content: {
    paddingLeft: '3rem',
    paddingRight: '0',
    height: '100%'
  },
  expandIcon: {
    left: '0.375rem',
    right: 'auto',
    transform: 'translateY(-50%) rotate(-90deg)',
    '&$expanded': {
      transform: 'translateY(-50%) rotate(0)'
    }
  }
}))(ExpansionPanelSummary)

class GroupPanelExpandIcon extends React.PureComponent {
  render() {
    return (
      <span className="u-click-xl">
        <Icon
          icon="bottom"
          className={styles.GroupPanelSummary__icon}
          width={12}
        />
      </span>
    )
  }
}

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
    warningLimit: PropTypes.number.isRequired,
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

  goToTransactionsFilteredByDoc = () => {
    const { group, filterByDoc, router } = this.props
    filterByDoc(group)

    const isReimbursementsVirtualGroup =
      group._id === 'Reimbursements' && group.virtual
    const route = isReimbursementsVirtualGroup
      ? '/balances/reimbursements'
      : '/balances/details'

    router.push(route)
  }

  handleSummaryContentClick = e => {
    const { group } = this.props

    if (group.loading) return
    e.stopPropagation()
    this.goToTransactionsFilteredByDoc()
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
      warningLimit,
      switches,
      onSwitchChange,
      checked,
      withBalance,
      t
    } = this.props

    const nbAccounts = group.accounts.data.length
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
      <ExpansionPanel expanded={expanded} onChange={this.handlePanelChange}>
        <GroupPanelSummary
          expandIcon={<GroupPanelExpandIcon />}
          IconButtonProps={{
            disableRipple: true
          }}
          className={cx({
            [styles['GroupPanelSummary--unchecked']]: !checked && isUncheckable
          })}
        >
          <div className={styles.GroupPanelSummary__content}>
            <div
              className={styles.GroupPanelSummary__labelBalanceWrapper}
              onClick={this.handleSummaryContentClick}
            >
              <div className={styles.GroupPanelSummary__label}>
                {group.label}
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
          <AccountsList
            group={group}
            warningLimit={warningLimit}
            switches={switches}
            onSwitchChange={onSwitchChange}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

export const DumbGroupPanel = GroupPanel

export default compose(
  withFilters,
  withRouter,
  translate()
)(GroupPanel)
