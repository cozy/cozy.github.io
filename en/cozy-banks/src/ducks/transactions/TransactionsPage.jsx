import React, { Component, useState, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import cx from 'classnames'
import endOfMonth from 'date-fns/end_of_month'
import isEqual from 'lodash/isEqual'
import debounce from 'lodash/debounce'
import compose from 'lodash/flowRight'

import { isMobileApp } from 'cozy-device-helper'
import {
  queryConnect,
  isQueryLoading,
  hasQueryBeenLoaded,
  useQuery
} from 'cozy-client'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import flag from 'cozy-flags'
import LinearProgress from '@material-ui/core/LinearProgress'
import Box from '@material-ui/core/Box'

import {
  ACCOUNT_DOCTYPE,
  accountsConn,
  groupsConn,
  cronKonnectorTriggersConn
} from 'doctypes'
import { getFilteringDoc } from 'ducks/filters'
import Padded from 'components/Padded'
import useLast from 'hooks/useLast'
import { getDisplayDate } from 'ducks/transactions/helpers'
import Loading from 'components/Loading'
import FutureBalanceCard from 'ducks/future/FutureBalanceCard'
import { TransactionList } from 'ducks/transactions/Transactions'
import styles from 'ducks/transactions/TransactionsPage.styl'
import TransactionHeader from 'ducks/transactions/TransactionHeader'
import BarTheme from 'ducks/bar/BarTheme'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'
import { trackPage } from 'ducks/tracking/browser'
import { makeFilteredTransactionsConn } from 'ducks/transactions/queries'

const getMonth = date => date.slice(0, 7)

const ProgressContainer = ({ children }) => {
  return (
    <Box minHeight="8px" marginBottom={-1}>
      {children}
    </Box>
  )
}

const updateListStyle = (listRef, headerRef) => {
  // eslint-disable-next-line
  let headerNodeParent = ReactDOM.findDOMNode(headerRef)
  if (!headerNodeParent) {
    headerNodeParent = document.querySelector('[role="header"]')
  }
  if (!headerNodeParent) {
    return
  }
  const headerNode = headerNodeParent.firstChild
  // eslint-disable-next-line
  const listNode = ReactDOM.findDOMNode(listRef)

  if (document.body.getBoundingClientRect().width < 768) {
    listNode.style.paddingTop = headerNode.getBoundingClientRect().height + 'px'
  } else {
    listNode.style.paddingTop = 0
  }

  listNode.style.opacity = 1
}

class TransactionsPage extends Component {
  constructor(props) {
    super(props)

    this.renderTransactions = this.renderTransactions.bind(this)
    this.handleChangeTopmostTransaction = this.handleChangeTopmostTransaction.bind(
      this
    )
    this.handleHeaderRef = this.handleHeaderRef.bind(this)
    this.handleListRef = this.handleListRef.bind(this)
    this.handleResize = debounce(this.handleResize.bind(this), 500, {
      trailing: true,
      leading: false
    })
    this.handleFetchMoreBecomeVisible = this.handleFetchMoreBecomeVisible.bind(
      this
    )
    this.handleChangeMonth = this.handleChangeMonth.bind(this)

    this.state = {
      limitMin: 0,
      limitMax: 1000000
    }
  }

  setCurrentMonthFollowingMostRecentTransaction() {
    // const transactions = this.props.filteredTransactions
    // if (!transactions || transactions.length === 0) {
    //   return
    // }
    // const mostRecentTransaction = maxBy(transactions, getDisplayDate)
    // if (!mostRecentTransaction) {
    //   return
    // }
    // const mostRecentMonth = getMonth(getDisplayDate(mostRecentTransaction))
  }

  componentDidMount() {
    this.trackPage()

    window.addEventListener('resize', this.handleResize)
    this.handleResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  handleResize() {
    updateListStyle(this.listRef, this.headerRef)
  }

  trackPage() {
    const { router } = this.props
    const { categoryName, subcategoryName } = router.params
    if (categoryName && subcategoryName) {
      trackPage(
        `analyse:${categoryName ? categoryName : 'home'}${
          subcategoryName ? `:details` : ''
        }`
      )
    } else {
      trackPage('mon_compte:compte')
    }
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.filteringDoc, prevProps.filteringDoc)) {
      this.setCurrentMonthFollowingMostRecentTransaction()
    } else if (
      isQueryLoading(prevProps.transactions) &&
      !isQueryLoading(this.props.transactions)
    ) {
      this.setCurrentMonthFollowingMostRecentTransaction()
    }
  }

  handleChangeTopmostTransaction(transaction) {
    this.setState({
      currentMonth: getMonth(getDisplayDate(transaction))
    })
  }

  /**
   * Updates this.state after
   *  - month change request from children
   *  - filtering doc change
   *
   * Will change the query that fetches the transactions
   */
  handleChangeMonth(month) {
    this.setState({
      currentMonth: month
    })
    this.props.onChangeMonth(month)
  }

  renderTransactions() {
    const { showTriggerErrors } = this.state
    const { t, transactions, filteringDoc } = this.props

    const isFilteringOnAccount =
      filteringDoc && filteringDoc._type === ACCOUNT_DOCTYPE
    const isFetching =
      isQueryLoading(transactions) && !hasQueryBeenLoaded(transactions)

    if (isFetching) {
      return <Loading loadingType="movements" />
    }

    if (transactions.data === 0) {
      return (
        <Padded className="u-pt-0">
          <Typography variant="body1">
            {t('Transactions.no-movements')}
          </Typography>
        </Padded>
      )
    }

    return (
      <TransactionList
        showTriggerErrors={showTriggerErrors}
        onChangeTopMostTransaction={this.handleChangeTopmostTransaction}
        onScroll={this.checkToActivateTopInfiniteScroll}
        transactions={transactions.data}
        canFetchMore={transactions.hasMore}
        filteringOnAccount={isFilteringOnAccount}
        manualLoadMore={isMobileApp()}
        onReachBottom={this.handleFetchMoreBecomeVisible}
      />
    )
  }

  handleFetchMoreBecomeVisible() {
    const { transactions } = this.props
    if (transactions.hasMore && transactions.fetchStatus === 'loaded') {
      transactions.fetchMore()
    }
  }

  handleListRef(ref) {
    this.listRef = ref
  }

  handleHeaderRef(ref) {
    this.headerRef = ref
  }

  render() {
    const {
      accounts,
      breakpoints: { isMobile },
      showHeader,
      showFutureBalance,
      className,
      transactions,
      isFetchingNewData
    } = this.props

    const areAccountsLoading =
      isQueryLoading(accounts) && !hasQueryBeenLoaded(accounts)

    const theme = 'primary'
    return (
      <TransactionActionsProvider>
        <BarTheme theme={theme} />
        {showHeader ? (
          <TransactionHeader
            ref={this.handleHeaderRef}
            transactions={transactions.data || []}
            handleChangeMonth={this.handleChangeMonth}
            currentMonth={this.state.currentMonth}
            showBackButton={this.props.showBackButton}
            showBalance={isMobile && !areAccountsLoading}
          />
        ) : null}
        <ProgressContainer>
          {isFetchingNewData ? <LinearProgress /> : null}
        </ProgressContainer>
        <div
          ref={this.handleListRef}
          style={{ opacity: 0 }}
          className={cx(
            styles.TransactionPage__transactions,
            className,
            'js-scrolling-element'
          )}
        >
          {flag('banks.future-balance') && showFutureBalance ? (
            <FutureBalanceCard />
          ) : null}
          {this.renderTransactions()}
        </div>
      </TransactionActionsProvider>
    )
  }
}

TransactionsPage.defaultProps = {
  showHeader: true,
  showFutureBalance: true
}

const mapStateToProps = state => ({
  filteringDoc: getFilteringDoc(state)
})

const autoUpdateOptions = {
  add: false,
  remove: true,
  update: true
}
const addMonthToConn = (baseConn, month) => {
  const { query: baseQuery, as: baseAs, ...rest } = baseConn
  const thresholdDate = endOfMonth(new Date(month))
  const query = baseQuery().where({ date: { $lt: thresholdDate } }, true)
  const as = `${baseAs}-${month}`
  return {
    query,
    as,
    autoUpdate: autoUpdateOptions,
    ...rest
  }
}

const setAutoUpdate = conn => ({ ...conn, autoUpdate: autoUpdateOptions })

const addTransactions = Component => props => {
  const [month, setMonth] = useState(null)
  const initialConn = makeFilteredTransactionsConn(props)
  const conn = useMemo(() => {
    return month
      ? addMonthToConn(initialConn, month)
      : setAutoUpdate(initialConn)
  }, [initialConn, month])
  const transactions = useQuery(conn.query, conn)
  const transactionsLoaded = useLast(transactions, (last, cur) => {
    return !last || cur.lastUpdate
  })
  const handleChangeMonth = useCallback(
    month => {
      setMonth(month)
    },
    [setMonth]
  )
  return (
    <Component
      {...props}
      transactions={transactionsLoaded}
      onChangeMonth={handleChangeMonth}
      isFetchingNewData={transactions !== transactionsLoaded}
    />
  )
}

export const DumbTransactionsPage = TransactionsPage
export const UnpluggedTransactionsPage = compose(
  withRouter,
  translate(),
  withBreakpoints()
)(TransactionsPage)

UnpluggedTransactionsPage.propTypes = {
  filteredTransactions: PropTypes.array.isRequired
}

const ConnectedTransactionsPage = compose(
  withRouter,
  queryConnect({
    accounts: accountsConn,
    groups: groupsConn,
    triggers: cronKonnectorTriggersConn
  }),
  addTransactions,
  connect(mapStateToProps)
)(UnpluggedTransactionsPage)

export const TransactionsPageWithBackButton = props => (
  <ConnectedTransactionsPage {...props} showBackButton />
)

export default ConnectedTransactionsPage
