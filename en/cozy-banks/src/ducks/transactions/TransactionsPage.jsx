import React, { Component, useState, useCallback, useMemo } from 'react'
import ReactDOM from 'react-dom'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'
import cx from 'classnames'
import debounce from 'lodash/debounce'
import compose from 'lodash/flowRight'

import {
  queryConnect,
  isQueryLoading,
  hasQueryBeenLoaded,
  useQuery
} from 'cozy-client'
import { translate } from 'cozy-ui/transpiled/react/providers/I18n'
import Typography from 'cozy-ui/transpiled/react/Typography'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import flag from 'cozy-flags'

import {
  ACCOUNT_DOCTYPE,
  accountsConn,
  groupsConn,
  konnectorTriggersConn
} from 'doctypes'
import { getFilteringDoc } from 'ducks/filters'
import Padded from 'components/Padded'
import HeaderLoadingProgress from 'components/HeaderLoadingProgress'
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
import {
  addMonthToConn,
  makeFilteredTransactionsConn
} from 'ducks/transactions/queries'
import getScrollingElement, {
  DESKTOP_SCROLLING_ELEMENT_CLASSNAME
} from './scroll/getScrollingElement'

const getMonth = date => date.slice(0, 7)

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

  if (document.body.getBoundingClientRect().width < 1024) {
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
    this.handleChangeTopmostTransaction =
      this.handleChangeTopmostTransaction.bind(this)
    this.handleHeaderRef = this.handleHeaderRef.bind(this)
    this.handleListRef = this.handleListRef.bind(this)
    this.handleResize = debounce(this.handleResize.bind(this), 500, {
      trailing: true,
      leading: false
    })
    this.handleFetchMoreBecomeVisible =
      this.handleFetchMoreBecomeVisible.bind(this)
    this.handleChangeMonth = this.handleChangeMonth.bind(this)
    this.state = {
      currentMonth: null
    }
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
    const { params } = this.props
    const { categoryName, subcategoryName } = params
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

    const {
      breakpoints: { isDesktop }
    } = this.props
    const scrollingElement = getScrollingElement(isDesktop)
    scrollingElement.scrollTo({ top: 0 })
  }

  renderTransactions() {
    const { t, transactions, filteringDoc, showTriggerErrors } = this.props

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
        transactions={transactions.data}
        canFetchMore={transactions.hasMore}
        filteringOnAccount={isFilteringOnAccount}
        onReachBottom={this.handleFetchMoreBecomeVisible}
      />
    )
  }

  async handleFetchMoreBecomeVisible() {
    const { transactions } = this.props
    if (
      transactions.hasMore &&
      transactions.fetchStatus === 'loaded' &&
      !this.fetchingMore
    ) {
      try {
        this.fetchingMore = true
        await transactions.fetchMore()
      } finally {
        this.fetchingMore = false
      }
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
      showHeader,
      showFutureBalance,
      className,
      transactions,
      isFetchingNewData
    } = this.props

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
          />
        ) : null}
        <HeaderLoadingProgress
          isFetching={isFetchingNewData || !!this.fetchingMore}
        />
        <div
          ref={this.handleListRef}
          style={{ opacity: 0 }}
          className={cx(
            styles.TransactionPage__transactions,
            className,
            DESKTOP_SCROLLING_ELEMENT_CLASSNAME
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

const setAutoUpdate = conn => ({ ...conn, autoUpdate: autoUpdateOptions })

const addTransactions = Component => {
  const Wrapped = props => {
    const [month, setMonth] = useState(null)
    const initialConn = makeFilteredTransactionsConn(props)
    const conn = useMemo(() => {
      return month
        ? setAutoUpdate(addMonthToConn(initialConn, month))
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

  Wrapped.displayName = `withTransactions(${
    Component.displayName || Component.name
  })`
  return Wrapped
}

export const DumbTransactionsPage = TransactionsPage

const TransactionsPageWrapper = ({ children, ...props }) => {
  const params = useParams()
  return (
    <TransactionsPage params={params} {...props}>
      {children}
    </TransactionsPage>
  )
}

export const UnpluggedTransactionsPage = compose(
  translate(),
  withBreakpoints()
)(TransactionsPageWrapper)

const ConnectedTransactionsPage = compose(
  queryConnect({
    accounts: accountsConn,
    groups: groupsConn,
    triggers: konnectorTriggersConn
  }),
  addTransactions,
  connect(mapStateToProps)
)(UnpluggedTransactionsPage)

export const TransactionsPageWithBackButton = props => (
  <ConnectedTransactionsPage {...props} showBackButton />
)

export default ConnectedTransactionsPage
