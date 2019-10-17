/* global cozy */

import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import { isMobileApp } from 'cozy-device-helper'
import { translate, withBreakpoints } from 'cozy-ui/react'

import { flowRight as compose, isEqual, findIndex, uniq, maxBy } from 'lodash'
import { getFilteredAccounts, getFilteringDoc } from 'ducks/filters'
import BarBalance from 'components/BarBalance'
import { Padded } from 'components/Spacing'

import {
  getTransactionsFilteredByAccount,
  getFilteredAccountIds,
  getFilteredTransactions
} from 'ducks/filters'

import { getCategoryIdFromName } from 'ducks/categories/categoriesMap'
import { getDate, getDisplayDate } from 'ducks/transactions/helpers'

import { queryConnect } from 'cozy-client'

import Loading from 'components/Loading'
import Delayed from 'components/Delayed'
import { TransactionsWithSelection } from 'ducks/transactions/Transactions.jsx'

import {
  ACCOUNT_DOCTYPE,
  accountsConn,
  groupsConn,
  triggersConn,
  transactionsConn
} from 'doctypes'

import TransactionHeader from 'ducks/transactions/TransactionHeader'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { findNearestMonth } from 'ducks/transactions/helpers'

import { getChartTransactions } from 'ducks/chart/selectors'

import BarTheme from 'ducks/bar/BarTheme'
import TransactionActionsProvider from 'ducks/transactions/TransactionActionsProvider'

const { BarRight } = cozy.bar

const STEP_INFINITE_SCROLL = 30
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
    this.setState({
      currentMonth: getMonth(getDisplayDate(mostRecentTransaction))
    })
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.accountIds, prevProps.accountIds)) {
      this.setCurrentMonthFollowingMostRecentTransaction()
    }
    if (
      isCollectionLoading(prevProps.transactions) &&
      !isCollectionLoading(this.props.transactions)
    ) {
      this.setCurrentMonthFollowingMostRecentTransaction()
    }
    if (prevProps.filteringDoc !== this.props.filteringDoc) {
      this.handleChangeMonth(this.state.currentMonth)
    }
  }

  handleChangeTopmostTransaction(transaction) {
    this.setState({
      currentMonth: getMonth(getDisplayDate(transaction))
    })
  }

  handleIncreaseLimitMax() {
    this.setState({
      limitMax: this.state.limitMax + STEP_INFINITE_SCROLL
    })
  }

  handleDecreaseLimitMin(amount = STEP_INFINITE_SCROLL) {
    const transactions = this.props.filteredTransactions
    let goal = Math.max(this.state.limitMin - amount, 0)

    // try not have a cut on the same day
    while (
      goal > 0 &&
      getDate(transactions[goal]) === getDate(transactions[goal - 1])
    ) {
      goal--
    }
    this.setState({
      limitMin: goal
    })
  }

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
        limitMax: limitMin + 10,
        currentMonth: month,
        infiniteScrollTop: false
      },
      () => {
        // need to scroll past the LoadMore button
        if (isMobileApp()) {
          const LoadMoreBtn = document.querySelector('.js-LoadMore')
          const padding = 15
          const scrollTo = LoadMoreBtn
            ? LoadMoreBtn.getBoundingClientRect().bottom +
              window.scrollY -
              padding
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
    const { limitMin, limitMax, infiniteScrollTop } = this.state
    const { t } = this.props
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
        <TransactionsWithSelection
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

  render() {
    const {
      accounts,
      transactions,
      breakpoints: { isMobile },
      filteredAccounts
    } = this.props

    const isFetching =
      isCollectionLoading(transactions) && !hasBeenLoaded(transactions)
    const areAccountsLoading =
      isCollectionLoading(accounts) && !hasBeenLoaded(accounts)
    const filteredTransactions = this.getTransactions()

    const isOnSubcategory = onSubcategory(this.props)
    const theme = 'primary'
    return (
      <TransactionActionsProvider>
        <BarTheme theme={theme} />
        <TransactionHeader
          transactions={filteredTransactions}
          handleChangeMonth={this.handleChangeMonth}
          currentMonth={this.state.currentMonth}
          showBackButton={this.props.showBackButton}
        />
        {isMobile && !areAccountsLoading && !isOnSubcategory && (
          <TransactionsPageBar accounts={filteredAccounts} theme={theme} />
        )}
        {isFetching ? (
          <Loading loadingType="movements" />
        ) : (
          this.renderTransactions()
        )}
      </TransactionActionsProvider>
    )
  }
}

export const TransactionsPageBar = ({ accounts, theme }) => (
  <BarRight>
    <BarBalance accounts={accounts} theme={theme} />
  </BarRight>
)

const onSubcategory = ownProps => ownProps.router.params.subcategoryName

const mapStateToProps = (state, ownProps) => {
  const filteredTransactions = onSubcategory(ownProps)
    ? getFilteredTransactions(state)
    : getTransactionsFilteredByAccount(state)

  return {
    accountIds: getFilteredAccountIds(state),
    filteringDoc: getFilteringDoc(state),
    filteredAccounts: getFilteredAccounts(state),
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
  filteredTransactions: PropTypes.array.isRequired,
  filteredAccounts: PropTypes.array.isRequired
}

const ConnectedTransactionsPage = compose(
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
