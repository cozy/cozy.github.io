/* global __TARGET__ */

import debounce from 'lodash/debounce'
import set from 'lodash/set'
import sumBy from 'lodash/sumBy'
import get from 'lodash/get'
import compose from 'lodash/flowRight'

import React, { PureComponent, Fragment } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import { createStructuredSelector } from 'reselect'
import cx from 'classnames'

import {
  queryConnect,
  withClient,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import flag from 'cozy-flags'
import CozyRealtime from 'cozy-realtime'

import {
  groupsConn,
  settingsConn,
  cronKonnectorTriggersConn,
  accountsConn,
  ACCOUNT_DOCTYPE,
  GROUP_DOCTYPE,
  TRIGGER_DOCTYPE,
  TRANSACTION_DOCTYPE,
  makeBalanceTransactionsConn
} from 'doctypes'

import { getVirtualAccounts, getVirtualGroups } from 'selectors'

import Loading from 'components/Loading'
import Padded from 'components/Padded'
import BalanceHeader from 'ducks/balance/BalanceHeader'
import NoAccount from 'ducks/balance/NoAccount'
import AccountsImporting from 'ducks/balance/AccountsImporting'

import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import { getAccountBalance } from 'ducks/account/helpers'
import styles from 'ducks/balance/Balance.styl'
import BalancePanels from 'ducks/balance/BalancePanels'
import { getPanelsState } from 'ducks/balance/helpers'
import BarTheme from 'ducks/bar/BarTheme'
import { filterByAccounts } from 'ducks/filters'
import { trackPage } from 'ducks/tracking/browser'
import { isVirtualAccount } from 'ducks/balance/helpers'
import ImportGroupPanel from 'ducks/balance/ImportGroupPanel'
import Delayed from 'components/Delayed'
import useFullyLoadedQuery from 'hooks/useFullyLoadedQuery'
import withBankingSlugs from 'hoc/withBankingSlugs'

const syncPouchImmediately = async client => {
  const pouchLink = client.links.find(link => link.pouches)
  const pouchManager = pouchLink.pouches
  await pouchManager.syncImmediately()
}

const REALTIME_DOCTYPES = [
  ACCOUNT_DOCTYPE,
  TRIGGER_DOCTYPE,
  TRANSACTION_DOCTYPE,
  GROUP_DOCTYPE
]

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

    this.handleResume = this.handleResume.bind(this)
    this.updateQueries = this.updateQueries.bind(this)
    this.handleRealtime = debounce(this.handleRealtime.bind(this), 1000, {
      leading: false,
      trailing: true
    })
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

    return {
      panels: newPanelsState
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
    const { router, filterByAccounts } = this.props
    filterByAccounts(this.getCheckedAccounts())
    router.push('/balances/details')
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

  getAllAccounts() {
    const { accounts: accountsCollection, virtualAccounts } = this.props
    return [...accountsCollection.data, ...virtualAccounts]
  }

  getCheckedAccounts() {
    const accounts = this.getAllAccounts()

    return accounts.filter(account => {
      const occurrences = this.getAccountOccurrencesInState(account)

      return occurrences.some(
        occurrence => occurrence.checked && !occurrence.disabled
      )
    })
  }

  ensureRealtime() {
    if (this.realtime) {
      return
    }
    const client = this.props.client
    this.realtime = new CozyRealtime({ client })
  }

  startRealtime() {
    if (this.realtimeStarted) {
      return
    }
    this.ensureRealtime()
    for (const doctype of REALTIME_DOCTYPES) {
      this.realtime.subscribe('created', doctype, this.handleRealtime)
      this.realtime.subscribe('updated', doctype, this.handleRealtime)
      this.realtime.subscribe('deleted', doctype, this.handleRealtime)
    }
    this.realtimeStarted = true
  }

  stopRealtime() {
    if (!this.realtimeStarted || !this.realtime) {
      return
    }
    for (const doctype of REALTIME_DOCTYPES) {
      this.realtime.unsubscribe('created', doctype, this.handleRealtime)
      this.realtime.unsubscribe('updated', doctype, this.handleRealtime)
      this.realtime.unsubscribe('deleted', doctype, this.handleRealtime)
    }
    this.realtimeStarted = false
  }

  async handleRealtime() {
    const { client } = this.props
    if (__TARGET__ === 'mobile') {
      syncPouchImmediately(client)
    }
    // TODO discriminate on the ev received to only fetch what is important
    this.updateQueries()
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
    this.props.triggers.fetch()
  }

  handleResume() {
    this.updateQueries()
  }

  startResumeListeners() {
    if (__TARGET__ === 'mobile') {
      document.addEventListener('resume', this.handleResume)
      window.addEventListener('online', this.handleResume)
    }
  }

  stopResumeListeners() {
    if (__TARGET__ === 'mobile') {
      document.removeEventListener('resume', this.handleResume)
      window.removeEventListener('online', this.handleResume)
    }
  }

  componentDidMount() {
    this.startResumeListeners()
    trackPage('moncompte:home')
  }

  componentWillUnmount() {
    this.stopRealtime()
    this.stopRealtimeFallback()
    this.stopResumeListeners()
  }

  componentDidUpdate() {
    this.ensureListenersProperlyConfigured()
  }

  ensureListenersProperlyConfigured() {
    try {
      this._ensureListenersProperlyConfigured()
    } catch (e) {
      /* eslint-disable no-console */
      console.error(e)
      console.warn(
        'Balance: Could not correctly configure realtime, see error above.'
      )
      /* eslint-enable no-console */
    }
  }

  _ensureListenersProperlyConfigured() {
    const { accounts: accountsCollection } = this.props

    const collections = [accountsCollection]
    if (collections.some(isQueryLoading)) {
      return
    }

    // See issue #2009 https://github.com/cozy/cozy-banks/issues/2009
    this.startRealtime()
    this.startRealtimeFallback()
    this.startResumeListeners()
  }

  /**
   * Starts setInterval loop, as a fallback in case realtime does not work.
   * If already started, does nothing.
   */
  startRealtimeFallback() {
    if (!this.realtimeFallbackInterval && !this.realtimeStarted) {
      this.realtimeFallbackInterval = setInterval(this.updateQueries, 30 * 1000)
    }
  }

  /**
   * Stops  the realtime fallback loop, and clears the setIntervalId
   * If not started, does nothing.
   */
  stopRealtimeFallback() {
    if (!this.realtimeFallbackInterval) {
      return
    }
    clearInterval(this.realtimeFallbackInterval)
    this.realtimeFallbackInterval = null
  }

  render() {
    if (isLoading(this.props)) {
      return (
        <Fragment>
          <BarTheme theme="primary" />
          <BalanceHeader />
          <Loading />
        </Fragment>
      )
    }

    const { triggers: triggersCollection } = this.props
    const accounts = this.getAllAccounts()
    const triggers = triggersCollection.data

    const hasNoAccount = accounts.filter(a => !isVirtualAccount(a)).length === 0

    if (
      hasNoAccount ||
      flag('balance.no-account') ||
      flag('banks.balance.account-loading')
    ) {
      let konnectorInfos = triggers
        .map(x => x.attributes)
        .filter(this.props.isBankTrigger)
        .map(t => ({
          konnector: get(t, 'message.konnector'),
          account: get(t, 'message.account'),
          status: get(t, 'current_state.status')
        }))

      if (flag('banks.balance.account-loading')) {
        // eslint-disable-next-line no-console
        console.log('konnectorInfos', konnectorInfos)

        if (konnectorInfos.length === 0) {
          konnectorInfos = [
            {
              konnector: 'creditcooperatif148',
              status: 'done'
            },
            {
              konnector: 'labanquepostale44',
              account: 'fakeId',
              status: 'errored'
            }
          ]
        }
      }

      const hasKonnectorRunning = konnectorInfos.some(
        k => k.status === 'running'
      )
      if (hasKonnectorRunning) {
        return <AccountsImporting konnectorInfos={konnectorInfos} />
      }

      return <NoAccount />
    }

    const groups = getAllGroups(this.props)
    const checkedAccounts = this.getCheckedAccounts()
    const accountsBalance = sumBy(checkedAccounts, getAccountBalance)
    const subtitleParams =
      checkedAccounts.length === accounts.length
        ? undefined
        : {
            nbCheckedAccounts: checkedAccounts.length,
            nbAccounts: accounts.length
          }

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
  withRouter,
  connect(null, actionCreators),
  queryConnect({
    accounts: accountsConn,
    groups: groupsConn,
    settings: settingsConn,
    triggers: cronKonnectorTriggersConn
  }),
  connect(
    createStructuredSelector({
      virtualAccounts: getVirtualAccounts,
      virtualGroups: getVirtualGroups
    })
  ),
  withClient,
  addTransactions,
  withBankingSlugs
)(Balance)
