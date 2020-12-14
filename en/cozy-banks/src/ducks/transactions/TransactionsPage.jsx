import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import cx from 'classnames'

import { isMobileApp } from 'cozy-device-helper'
import { queryConnect, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import flag from 'cozy-flags'

import maxBy from 'lodash/maxBy'
import uniq from 'lodash/uniq'
import findIndex from 'lodash/findIndex'
import isEqual from 'lodash/isEqual'
import debounce from 'lodash/debounce'
import compose from 'lodash/flowRight'
import {
  getFilteringDoc,
  getTransactionsFilteredByAccount,
  getFilteredTransactions
} from 'ducks/filters'
import Padded from 'components/Padded'

import { getCategoryIdFromName } from 'ducks/categories/categoriesMap'
import {
  getDate,
  getDisplayDate,
  findNearestMonth
} from 'ducks/transactions/helpers'

import Loading from 'components/Loading'
import Delayed from 'components/Delayed'
import FutureBalanceCard from 'ducks/future/FutureBalanceCard'
import { TransactionList } from 'ducks/transactions/Transactions.jsx'
import styles from 'ducks/transactions/TransactionsPage.styl'

import {
  ACCOUNT_DOCTYPE,
  accountsConn,
  groupsConn,
  triggersConn,
  transactionsConn
} from 'doctypes'

import TransactionHeader from 'ducks/transactions/TransactionHeader'
import { getChartTransactions } from 'ducks/chart/selectors'
import BarTheme from 'ducks/bar/BarTheme'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'

import { trackPage } from 'ducks/tracking/browser'

const getHeaderHeight = () => {
  return document.querySelector('[role=header]').getBoundingClientRect().height
}

export const STEP_INFINITE_SCROLL = 30
export const MIN_NB_TRANSACTIONS_SHOWN = 30

const SCROLL_THRESOLD_TO_ACTIVATE_TOP_INFINITE_SCROLL = 150
const getMonth = date => date.slice(0, 7)

const FakeTransactions = () => <Padded>{null}</Padded>

class TransactionsPage extends Component {
  constructor(props) {
    super(props)

    this.renderTransactions = this.renderTransactions.bind(this)
    this.handleDecreaseLimitMin = this.handleDecreaseLimitMin.bind(this)
    this.handleIncreaseLimitMax = this.handleIncreaseLimitMax.bind(this)
    this.handleChangeMonth = this.handleChangeMonth.bind(this)
    this.handleChangeTopmostTransaction = this.handleChangeTopmostTransaction.bind(
      this
    )
    this.handleHeaderRef = this.handleHeaderRef.bind(this)
    this.handleListRef = this.handleListRef.bind(this)
    this.handleResize = debounce(this.handleResize.bind(this), 500, {
      trailing: true,
      leading: false
    })

    this.checkToActivateTopInfiniteScroll = this.checkToActivateTopInfiniteScroll.bind(
      this
    )

    this.state = {
      limitMin: 0,
      limitMax: STEP_INFINITE_SCROLL,
      infiniteScrollTop: false
    }
  }

  setCurrentMonthFollowingMostRecentTransaction() {
    const transactions = this.props.filteredTransactions
    if (!transactions || transactions.length === 0) {
      return
    }
    const mostRecentTransaction = maxBy(transactions, getDisplayDate)
    if (!mostRecentTransaction) {
      return
    }
    const mostRecentMonth = getMonth(getDisplayDate(mostRecentTransaction))
    this.handleChangeMonth(mostRecentMonth)
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
    // eslint-disable-next-line
    let headerNodeParent = ReactDOM.findDOMNode(this.headerRef)
    if (!headerNodeParent) {
      headerNodeParent = document.querySelector('[role="header"]')
    }
    const headerNode = headerNodeParent.firstChild
    // eslint-disable-next-line
    const listNode = ReactDOM.findDOMNode(this.listRef)

    if (document.body.getBoundingClientRect().width < 768) {
      listNode.style.paddingTop =
        headerNode.getBoundingClientRect().height + 'px'
    } else {
      listNode.style.paddingTop = 0
    }

    listNode.style.opacity = 1
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

  handleIncreaseLimitMax() {
    if (this.increasing) {
      return
    }
    this.increasing = true
    this.setState(
      {
        limitMax: this.state.limitMax + STEP_INFINITE_SCROLL
      },
      () => {
        this.increasing = false
      }
    )
  }

  handleDecreaseLimitMin(amount = STEP_INFINITE_SCROLL) {
    if (!this.increasing) {
      return
    }
    this.increasing = true
    const transactions = this.props.filteredTransactions
    let goal = Math.max(this.state.limitMin - amount, 0)

    // try not have a cut on the same day
    while (
      goal > 0 &&
      getDate(transactions[goal]) === getDate(transactions[goal - 1])
    ) {
      goal--
    }
    this.setState(
      {
        limitMin: goal
      },
      () => {
        this.increasing = false
      }
    )
  }

  /**
   * Updates this.state after
   *  - month change request from children
   *  - filtering doc change
   *
   * - Updates limitMin/limitMax slicing the transactions array so that
   *   we see only transactions for the selected month
   * - Updates currentMonth to be `month`
   */
  handleChangeMonth(month) {
    const transactions = this.props.filteredTransactions
    const findMonthIndex = month =>
      findIndex(transactions, t => getDisplayDate(t).indexOf(month) === 0)
    let limitMin = findMonthIndex(month)

    if (limitMin == -1) {
      const monthsWithOperations = uniq(
        transactions.map(x => getMonth(getDisplayDate(x)))
      ).sort()
      const nearestMonth = findNearestMonth(
        month,
        this.state.currentMonth,
        monthsWithOperations
      )
      if (nearestMonth) {
        month = nearestMonth
        limitMin = findMonthIndex(month)
      } else {
        month = monthsWithOperations[0]
        limitMin = 0
      }
    }
    this.setState(
      {
        limitMin: limitMin,
        limitMax: limitMin + MIN_NB_TRANSACTIONS_SHOWN,
        currentMonth: month,
        infiniteScrollTop: false
      },
      () => {
        // need to scroll past the LoadMore button
        if (isMobileApp()) {
          const loadMoreBtn = document.querySelector('.js-topLoadMoreButton')
          const barHeight = 48
          const headerHeight = getHeaderHeight()
          const scrollTo = loadMoreBtn
            ? loadMoreBtn.getBoundingClientRect().bottom +
              window.scrollY -
              barHeight -
              headerHeight
            : 0
          window.scrollTo(0, scrollTo)
        }
      }
    )
  }

  checkToActivateTopInfiniteScroll(getScrollInfo) {
    const scrollInfo = getScrollInfo()
    if (scrollInfo.scroll > SCROLL_THRESOLD_TO_ACTIVATE_TOP_INFINITE_SCROLL) {
      this.setState({ infiniteScrollTop: true })
    }
  }

  getTransactions = () => {
    const {
      filteredTransactions,
      router: {
        params: { subcategoryName }
      }
    } = this.props
    const categoryId = subcategoryName
      ? getCategoryIdFromName(subcategoryName)
      : null
    return getChartTransactions(filteredTransactions, categoryId)
  }

  getFilteringOnAccount = () => {
    const { filteringDoc } = this.props

    return filteringDoc && filteringDoc._type === ACCOUNT_DOCTYPE
  }

  renderTransactions() {
    const {
      limitMin,
      limitMax,
      infiniteScrollTop,
      showTriggerErrors
    } = this.state
    const { t, transactions: transactionCol } = this.props
    const isFetching =
      isQueryLoading(transactionCol) && !hasQueryBeenLoaded(transactionCol)

    if (isFetching) {
      return <Loading loadingType="movements" />
    }

    const transactions = this.getTransactions()

    if (transactions.length === 0) {
      return (
        <Padded className="u-pt-0">
          <p>{t('Transactions.no-movements')}</p>
        </Padded>
      )
    }

    return (
      <Delayed delay={0} fallback={<FakeTransactions />}>
        <TransactionList
          showTriggerErrors={showTriggerErrors}
          limitMin={limitMin}
          limitMax={limitMax}
          onReachTop={this.handleDecreaseLimitMin}
          onReachBottom={this.handleIncreaseLimitMax}
          infiniteScrollTop={infiniteScrollTop}
          onChangeTopMostTransaction={this.handleChangeTopmostTransaction}
          onScroll={this.checkToActivateTopInfiniteScroll}
          transactions={transactions}
          filteringOnAccount={this.getFilteringOnAccount()}
          manualLoadMore={isMobileApp()}
        />
      </Delayed>
    )
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
      className
    } = this.props

    const areAccountsLoading =
      isQueryLoading(accounts) && !hasQueryBeenLoaded(accounts)
    const filteredTransactions = this.getTransactions()

    const theme = 'primary'
    return (
      <TransactionActionsProvider>
        <BarTheme theme={theme} />
        {showHeader ? (
          <TransactionHeader
            ref={this.handleHeaderRef}
            transactions={filteredTransactions}
            handleChangeMonth={this.handleChangeMonth}
            currentMonth={this.state.currentMonth}
            showBackButton={this.props.showBackButton}
            showBalance={isMobile && !areAccountsLoading}
          />
        ) : null}
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

const onSubcategory = ownProps => ownProps.router.params.subcategoryName

const mapStateToProps = (state, ownProps) => {
  const filteredTransactions = onSubcategory(ownProps)
    ? getFilteredTransactions(state, ownProps)
    : getTransactionsFilteredByAccount(state)

  return {
    filteringDoc: getFilteringDoc(state),
    filteredTransactions: filteredTransactions
  }
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
    triggers: triggersConn,
    transactions: transactionsConn
  }),
  connect(mapStateToProps)
)(UnpluggedTransactionsPage)

export const TransactionsPageWithBackButton = props => (
  <ConnectedTransactionsPage {...props} showBackButton />
)

export default ConnectedTransactionsPage
