import debounce from 'lodash/debounce'
import set from 'lodash/set'
import sumBy from 'lodash/sumBy'
import compose from 'lodash/flowRight'
import isEqual from 'lodash/isEqual'

import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createStructuredSelector } from 'reselect'
import cx from 'classnames'

import {
  queryConnect,
  withClient,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import flag from 'cozy-flags'

import {
  groupsConn,
  settingsConn,
  accountsConn,
  makeBalanceTransactionsConn
} from 'doctypes'

import { getVirtualAccounts, getVirtualGroups } from 'selectors'

import Loading from 'components/Loading'
import Padded from 'components/Padded'
import BalanceHeader from 'ducks/balance/BalanceHeader'
import EmptyAccount from 'ducks/balance/EmptyAccount'

import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import { getAccountBalance } from 'ducks/account/helpers'
import styles from 'ducks/balance/Balance.styl'
import BalancePanels from 'ducks/balance/BalancePanels'
import { getPanelsState } from 'ducks/balance/helpers'
import BarTheme from 'ducks/bar/BarTheme'
import { filterByAccounts } from 'ducks/filters'
import { trackPage } from 'ducks/tracking/browser'
import ImportGroupPanel from 'ducks/balance/ImportGroupPanel'
import Delayed from 'components/Delayed'
import useFullyLoadedQuery from 'hooks/useFullyLoadedQuery'

const isLoading = props => {
  const {
    accounts: accountsCollection,
    groups: groupsCollection,
    settings: settingsCollection
  } = props

  const collections = [accountsCollection, groupsCollection, settingsCollection]

  return collections.some(
    col => isQueryLoading(col) && !hasQueryBeenLoaded(col)
  )
}

const getAllGroups = props => {
  const { groups, virtualGroups } = props

  return [...groups.data, ...virtualGroups]
}

const getAccounts = props => {
  return props.accounts.data
}

class Balance extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      panels: null
    }

    this.handleClickBalance = this.handleClickBalance.bind(this)
    this.handlePanelChange = this.handlePanelChange.bind(this)
    this.debouncedHandlePanelChange = debounce(this.handlePanelChange, 3000, {
      leading: false,
      trailing: true
    }).bind(this)

    this.updateQueries = this.updateQueries.bind(this)
    this.realtime = null
  }

  static getDerivedStateFromProps(props, state) {
    if (isLoading(props)) {
      return null
    }

    const { settings: settingsCollection } = props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    const allGroups = getAllGroups(props)
    const currentPanelsState = state.panels || settings.panelsState || {}
    const newPanelsState = getPanelsState(allGroups, currentPanelsState)
    // prevent rerender if the content is the same
    if (!isEqual(state.panels, newPanelsState)) {
      return {
        panels: newPanelsState
      }
    }
    return {
      panels: state.panels
    }
  }

  handleSwitchChange = (event, checked) => {
    const path = event.target.id + '.checked'

    this.setState(prevState => {
      const nextState = { ...prevState }
      set(nextState.panels, path, checked)

      return nextState
    }, this.savePanelState)
  }

  handlePanelChange(panelId, event, expanded) {
    const path = panelId + '.expanded'

    this.setState(prevState => {
      const nextState = { ...prevState }
      set(nextState.panels, path, expanded)

      return nextState
    }, this.savePanelState)
  }

  handleClickBalance() {
    const { navigate, filterByAccounts } = this.props
    filterByAccounts(this.getCheckedAccounts())
    navigate('/balances/details')
  }

  savePanelState() {
    const { panels } = this.state
    const { settings: settingsCollection, client } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)

    const newSettings = {
      ...settings,
      panelsState: panels
    }

    return client.save(newSettings)
  }

  getAccountOccurrencesInState(account) {
    const { panels } = this.state

    if (!panels) {
      return []
    }

    return Object.values(panels)
      .map(group => group.accounts[account._id])
      .filter(Boolean)
  }

  getCheckedAccounts() {
    const accounts = getAccounts(this.props)

    return accounts.filter(account => {
      const occurrences = this.getAccountOccurrencesInState(account)

      return occurrences.some(
        occurrence => occurrence.checked && !occurrence.disabled
      )
    })
  }

  updateQueries() {
    // eslint-disable-next-line
    this.props.accounts.fetch().then(resp => {
      // eslint-disable-next-line
      if (resp.meta.count > 0) {
        this.props.groups.fetch()
      }
    })
    this.props.transactions.fetch()
  }

  componentDidMount() {
    trackPage('moncompte:home')
  }

  render() {
    const { hasJobsInProgress } = this.props
    if (isLoading(this.props)) {
      return (
        <Fragment>
          <BarTheme theme="primary" />
          <BalanceHeader />
          <Loading />
        </Fragment>
      )
    }

    const accounts = getAccounts(this.props)
    const hasNoAccount = accounts.length === 0

    if (
      (hasNoAccount && !hasJobsInProgress) ||
      flag('balance.no-account') ||
      flag('banks.balance.account-loading')
    ) {
      return <EmptyAccount />
    }

    const checkedAccounts = this.getCheckedAccounts()
    const accountsBalance = sumBy(checkedAccounts, getAccountBalance)
    const subtitleParams =
      checkedAccounts.length === accounts.length
        ? undefined
        : {
            nbCheckedAccounts: checkedAccounts.length,
            nbAccounts: accounts.length
          }

    const groups = getAllGroups(this.props)

    return (
      <Fragment>
        <BarTheme theme="primary" />
        <BalanceHeader
          onClickBalance={this.handleClickBalance}
          accountsBalance={accountsBalance}
          accounts={checkedAccounts}
          subtitleParams={subtitleParams}
        />
        <Delayed delay={this.props.delayContent}>
          <Padded
            className={cx({
              [styles.Balance__panelsContainer]: true
            })}
          >
            <ImportGroupPanel />
            <BalancePanels
              groups={groups}
              panelsState={this.state.panels}
              onSwitchChange={this.handleSwitchChange}
              onPanelChange={this.debouncedHandlePanelChange}
            />
          </Padded>
        </Delayed>
      </Fragment>
    )
  }
}

Balance.defaultProps = {
  delayContent: 0
}

export const DumbBalance = Balance

const BalanceWrapper = ({ children, ...props }) => {
  const navigate = useNavigate()
  return (
    <Balance navigate={navigate} {...props}>
      {children}
    </Balance>
  )
}

const actionCreators = {
  filterByAccounts
}

const addTransactions = Component => {
  const Wrapped = props => {
    const conn = makeBalanceTransactionsConn()
    const transactions = useFullyLoadedQuery(conn.query, conn)
    return <Component {...props} transactions={transactions} />
  }
  Wrapped.displayName = `withTransactions(${
    Component.displayName || Component.name
  })`
  return Wrapped
}

export default compose(
  connect(null, actionCreators),
  queryConnect({
    accounts: accountsConn,
    groups: groupsConn,
    settings: settingsConn
  }),
  connect(
    createStructuredSelector({
      virtualAccounts: getVirtualAccounts,
      virtualGroups: getVirtualGroups
    })
  ),
  withClient,
  addTransactions
)(BalanceWrapper)
