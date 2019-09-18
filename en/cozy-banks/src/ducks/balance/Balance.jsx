/* global __TARGET__ */

import React, { PureComponent, Fragment } from 'react'
import { flowRight as compose, get, sumBy, set, debounce } from 'lodash'

import { queryConnect, withMutations, withClient } from 'cozy-client'
import flag from 'cozy-flags'
import {
  groupsConn,
  settingsConn,
  triggersConn,
  accountsConn,
  ACCOUNT_DOCTYPE,
  TRIGGER_DOCTYPE,
  TRANSACTION_DOCTYPE,
  transactionsConn
} from 'doctypes'
import cx from 'classnames'

import { connect } from 'react-redux'
import { withRouter } from 'react-router'

import Loading from 'components/Loading'
import { Padded } from 'components/Spacing'
import BalanceHeader from 'ducks/balance/components/BalanceHeader'
import NoAccount from 'ducks/balance/components/NoAccount'
import AccountsImporting from 'ducks/balance/components/AccountsImporting'

import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import { buildVirtualGroups } from 'ducks/groups/helpers'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { getAccountBalance, buildVirtualAccounts } from 'ducks/account/helpers'
import { isBankTrigger } from 'utils/triggers'

import styles from 'ducks/balance/Balance.styl'
import BalancePanels from 'ducks/balance/BalancePanels'
import { getPanelsState } from 'ducks/balance/helpers'
import BarTheme from 'ducks/bar/BarTheme'
import { filterByAccounts } from 'ducks/filters'
import CozyRealtime from 'cozy-realtime'

const syncPouchImmediately = async client => {
  const pouchLink = client.links.find(link => link.pouches)
  const pouchManager = pouchLink.pouches
  // @TODO replace by await pouchLink.syncImmediately() when
  // https://github.com/cozy/cozy-client/pull/434 is merged
  pouchManager.stopReplicationLoop()
  await pouchManager.startReplicationLoop()
}

const REALTIME_DOCTYPES = [
  ACCOUNT_DOCTYPE,
  TRIGGER_DOCTYPE,
  TRANSACTION_DOCTYPE
]

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
    const {
      groups,
      accounts,
      settings: settingsCollection,
      transactions
    } = props

    const isLoading =
      (isCollectionLoading(groups) && !hasBeenLoaded(groups)) ||
      (isCollectionLoading(accounts) && !hasBeenLoaded(accounts)) ||
      (isCollectionLoading(settingsCollection) &&
        !hasBeenLoaded(settingsCollection)) ||
      (isCollectionLoading(transactions) && !hasBeenLoaded(transactions))

    if (isLoading) {
      return null
    }

    const virtualAccounts = buildVirtualAccounts(transactions.data)
    const allAccounts = [...accounts.data, ...virtualAccounts]
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    const allGroups = [...groups.data, ...buildVirtualGroups(allAccounts)]
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
    const { settings: settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)

    const newSettings = {
      ...settings,
      panelsState: panels
    }

    return this.props.saveDocument(newSettings)
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
    const { accounts: accountsCollection } = this.props
    const accounts = accountsCollection.data

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
    this.props.accounts.fetch()
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

    const accounts = accountsCollection.data

    const collections = [accountsCollection]
    if (collections.some(isCollectionLoading)) {
      return
    }

    if (accounts.length > 0) {
      this.stopRealtime()
      this.stopRealtimeFallback()
      this.stopResumeListeners()
    } else {
      this.startRealtime()
      this.startRealtimeFallback()
      this.startResumeListeners()
    }
  }

  /**
   * Starts setInterval loop, as a fallback in case realtime does not work.
   * If already started, does nothing.
   */
  startRealtimeFallback() {
    if (this.realtimeFallbackInterval) {
      return
    }
    this.realtimeFallbackInterval = setInterval(this.updateQueries, 30 * 1000)
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
    const {
      accounts: accountsCollection,
      groups: groupsCollection,
      settings: settingsCollection,
      triggers: triggersCollection,
      transactions: transactionsCollection
    } = this.props

    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    const collections = [
      accountsCollection,
      groupsCollection,
      triggersCollection,
      transactionsCollection,
      settingsCollection
    ]

    if (
      collections.some(col => isCollectionLoading(col) && !hasBeenLoaded(col))
    ) {
      return (
        <Fragment>
          <BarTheme theme="primary" />
          <BalanceHeader transactionsCollection={transactionsCollection} />
          <Loading />
        </Fragment>
      )
    }

    const accounts = accountsCollection.data
    const triggers = triggersCollection.data
    const transactions = transactionsCollection.data
    const virtualAccounts = buildVirtualAccounts(transactions)
    const allAccounts = [...accounts, ...virtualAccounts]

    if (
      accounts.length === 0 ||
      flag('no-account') ||
      flag('account-loading')
    ) {
      let konnectorInfos = triggers
        .map(x => x.attributes)
        .filter(isBankTrigger)
        .map(t => ({
          konnector: get(t, 'message.konnector'),
          account: get(t, 'message.account'),
          status: get(t, 'current_state.status')
        }))

      if (flag('account-loading')) {
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

      if (konnectorInfos.length > 0) {
        return <AccountsImporting konnectorInfos={konnectorInfos} />
      }

      return <NoAccount />
    }

    const groups = [
      ...groupsCollection.data,
      ...buildVirtualGroups(allAccounts)
    ]

    const balanceLower = get(settings, 'notifications.balanceLower.value')

    const checkedAccounts = this.getCheckedAccounts()
    const accountsBalance = isCollectionLoading(accounts)
      ? 0
      : sumBy(checkedAccounts, getAccountBalance)
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
          transactionsCollection={transactionsCollection}
        />
        <Padded
          className={cx({
            [styles.Balance__panelsContainer]: true
          })}
        >
          <BalancePanels
            groups={groups}
            warningLimit={balanceLower}
            panelsState={this.state.panels}
            onSwitchChange={this.handleSwitchChange}
            onPanelChange={this.debouncedHandlePanelChange}
          />
        </Padded>
      </Fragment>
    )
  }
}

export const DumbBalance = Balance

const actionCreators = {
  filterByAccounts
}

export default compose(
  withRouter,
  connect(
    null,
    actionCreators
  ),
  queryConnect({
    accounts: accountsConn,
    groups: groupsConn,
    settings: settingsConn,
    triggers: triggersConn,
    transactions: transactionsConn
  }),
  withClient,
  withMutations()
)(Balance)
