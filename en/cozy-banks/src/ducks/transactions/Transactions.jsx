import React, { useMemo, useContext, createContext } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import keyBy from 'lodash/keyBy'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
import sortBy from 'lodash/sortBy'
import cx from 'classnames'
import { isIOSApp } from 'cozy-device-helper'

import { useI18n, withBreakpoints } from 'cozy-ui/transpiled/react'
import Button from 'cozy-ui/transpiled/react/Button'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'

import { Table } from 'components/Table'
import TransactionPageErrors from 'ducks/transactions/TransactionPageErrors'
import styles from 'ducks/transactions/Transactions.styl'
import {
  InfiniteScroll,
  ScrollRestore,
  TopMost
} from 'ducks/transactions/scroll'
import { RowDesktop, RowMobile } from 'ducks/transactions/TransactionRow'
import { getDate } from 'ducks/transactions/helpers'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

export const sortByDate = (transactions = []) =>
  sortBy(transactions, getDate).reverse()

const groupByDate = transactions => {
  const byDate = groupBy(transactions, x => getDate(x))
  return toPairs(byDate)
}

const loadMoreStyle = { textAlign: 'center' }
const loadMoreBtnStyle = { width: '100%', padding: '0.75rem', margin: 0 }
const LoadMoreButton = ({ onClick, className }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  const button = (
    <Button
      style={loadMoreBtnStyle}
      onClick={onClick}
      subtle
      className={className}
      label={t('Transactions.see-more')}
    />
  )
  return isMobile ? (
    <div style={loadMoreStyle}>{button}</div>
  ) : (
    <tbody>
      <tr>
        <td style={loadMoreStyle}>{button}</td>
      </tr>
    </tbody>
  )
}

export const TransactionsListContext = createContext({
  mobileSectionDateFormat: 'dddd D MMMM'
})

const SectionMobile = props => {
  const { f } = useI18n()
  const { mobileSectionDateFormat } = useContext(TransactionsListContext)
  const { date, children } = props
  return (
    <React.Fragment>
      <ListSubheader>{f(date, mobileSectionDateFormat)}</ListSubheader>
      {children}
    </React.Fragment>
  )
}

const SectionDesktop = props => {
  return <tbody {...props} />
}

const TransactionContainerMobile = props => {
  return <div {...props} />
}

/**
 * Groups transactions by date and renders them as a list
 * On desktop, the section headers will not be shown
 */
const TransactionSections = props => {
  const {
    limitMin,
    limitMax,
    filteringOnAccount,
    className,
    transactions,
    onRowRef
  } = props

  const { isDesktop, isExtraLarge } = useBreakpoints()

  const transactionsGrouped = useMemo(
    () => groupByDate(transactions.slice(limitMin, limitMax)),
    [transactions, limitMin, limitMax]
  )
  const Section = isDesktop ? SectionDesktop : SectionMobile
  const TransactionContainer = isDesktop ? Table : TransactionContainerMobile
  const Row = isDesktop ? RowDesktop : RowMobile

  return (
    <TransactionContainer className={cx(styles.TransactionTable, className)}>
      {transactionsGrouped.map((dateAndGroup, id) => {
        const date = dateAndGroup[0]
        const transactionGroup = dateAndGroup[1]
        return (
          <Section date={date} key={id}>
            {transactionGroup.map(transaction => {
              return (
                <Row
                  key={transaction._id}
                  onRef={onRowRef}
                  transaction={transaction}
                  isExtraLarge={isExtraLarge}
                  filteringOnAccount={filteringOnAccount}
                />
              )
            })}
          </Section>
        )
      })}
    </TransactionContainer>
  )
}

const shouldRestore = (oldProps, nextProps) => {
  return (
    oldProps.limitMin !== nextProps.limitMin &&
    oldProps.limitMax === nextProps.limitMax
  )
}

export class TransactionsDumb extends React.Component {
  state = {
    infiniteScrollTop: false
  }

  constructor(props) {
    super(props)
    this.topmost = new TopMost(this.getScrollingElement)
    this.handleRefRow = this.handleRefRow.bind(this)
    this.handleScroll = (isIOSApp() ? debounce : throttle)(
      this.handleScroll.bind(this),
      300,
      { leading: false, trailing: true }
    )
  }

  UNSAFE_componentWillMount() {
    this.updateTransactions(this.props.transactions)
  }

  UNSAFE_componentWillUpdate(nextProps) {
    if (this.props.transactions !== nextProps.transactions) {
      this.updateTransactions(nextProps.transactions)
    }
  }

  updateTransactions(transactions) {
    this.transactionsById = keyBy(transactions, '_id')
    this.transactions = sortByDate(transactions)
  }

  updateTopMostVisibleTransaction() {
    const topMostTransactionId = this.topmost.getTopMostVisibleNodeId()
    const topMostTransaction = this.transactionsById[topMostTransactionId]
    if (topMostTransaction && this.props.onChangeTopMostTransaction) {
      this.props.onChangeTopMostTransaction(topMostTransaction)
    }
  }

  /**
   * Debounced in the constructor
   */
  handleScroll(getScrollInfo) {
    const { onScroll } = this.props

    if (onScroll) {
      onScroll(getScrollInfo)
    }

    this.updateTopMostVisibleTransaction()
  }

  handleRefRow(transactionId, ref) {
    const node = ReactDOM.findDOMNode(ref) // eslint-disable-line
    this.topmost.addNode(transactionId, node)
  }

  getScrollingElement = () => {
    const {
      breakpoints: { isDesktop }
    } = this.props
    return isDesktop ? document.querySelector('.js-scrolling-element') : window
  }

  render() {
    const {
      limitMin,
      limitMax,
      manualLoadMore,
      showTriggerErrors,
      filteringOnAccount,
      className,
      transactions,
      TransactionSections
    } = this.props

    return (
      <InfiniteScroll
        manual={manualLoadMore}
        canLoadAtTop={this.props.infiniteScrollTop && limitMin > 0}
        canLoadAtBottom={
          this.transactions && limitMax < this.transactions.length
        }
        limitMin={limitMin}
        limitMax={limitMax}
        onReachTop={this.props.onReachTop}
        onReachBottom={this.props.onReachBottom}
        getScrollingElement={this.getScrollingElement}
        onScroll={this.handleScroll}
        className={this.props.className}
      >
        {showTriggerErrors ? <TransactionPageErrors /> : null}
        <ScrollRestore
          limitMin={limitMin}
          limitMax={limitMax}
          getScrollingElement={this.getScrollingElement}
          shouldRestore={shouldRestore}
        >
          {manualLoadMore && limitMin > 0 && (
            <LoadMoreButton
              className="js-topLoadMoreButton"
              onClick={() => this.props.onReachTop(20)}
            />
          )}

          <TransactionSections
            limitMin={limitMin}
            limitMax={limitMax}
            filteringOnAccount={filteringOnAccount}
            className={className}
            transactions={transactions}
            onRowRef={this.handleRefRow}
          />
          {manualLoadMore && limitMax < this.transactions.length && (
            <LoadMoreButton
              className="js-bottomLoadMoreButton"
              onClick={() => this.props.onReachBottom(20)}
            />
          )}
        </ScrollRestore>
      </InfiniteScroll>
    )
  }
}

TransactionsDumb.propTypes = {
  showTriggerErrors: PropTypes.bool,

  /* Used in test to mock TransactionSections */
  TransactionSections: PropTypes.elementType
}

TransactionsDumb.defaultProps = {
  showTriggerErrors: true,
  TransactionSections
}

const Transactions = TransactionsDumb

export const TransactionList = withBreakpoints()(Transactions)
