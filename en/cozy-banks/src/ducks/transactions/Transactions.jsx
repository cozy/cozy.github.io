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
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import ListSubheader from 'cozy-ui/transpiled/react/MuiCozyTheme/ListSubheader'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import { Table } from 'components/Table'
import TransactionPageErrors from 'ducks/transactions/TransactionPageErrors'
import styles from 'ducks/transactions/Transactions.styl'
import { InfiniteScroll, TopMost } from 'ducks/transactions/scroll'
import TransactionRowMobile from 'ducks/transactions/TransactionRow/TransactionRowMobile'
import TransactionRowDesktop from 'ducks/transactions/TransactionRow/TransactionRowDesktop'
import { getDate } from 'ducks/transactions/helpers'
import useVisible from 'hooks/useVisible'

export const sortByDate = (transactions = []) =>
  sortBy(transactions, getDate).reverse()

const groupByDate = transactions => {
  const byDate = groupBy(transactions, x => getDate(x))
  return toPairs(byDate)
}

export const TransactionsListContext = createContext({
  mobileSectionDateFormat: 'dddd D MMMM'
})

const observerOptions = {
  threshold: [0, 1],
  margin: '-200px 0px 0px 0px'
}

const emptyDesktopSectionStyle = { height: 80 }
const emptyMobileSectionStyle = { height: 100 }

const SectionMobile = ({ initialVisible, ...props }) => {
  const [ref, visible] = useVisible(initialVisible, observerOptions)
  const { f } = useI18n()
  const { mobileSectionDateFormat } = useContext(TransactionsListContext)
  const { date, children } = props
  if (!visible) {
    return (
      <>
        <ListSubheader ref={ref}>
          {f(date, mobileSectionDateFormat)}
        </ListSubheader>
        <div style={emptyMobileSectionStyle} />
      </>
    )
  }
  return (
    <>
      <ListSubheader ref={ref}>
        {f(date, mobileSectionDateFormat)}
      </ListSubheader>
      {children}
    </>
  )
}

const VisibleSectionDesktop = ({ initialVisible, ...props }) => {
  const [ref, visible] = useVisible(initialVisible)
  return visible ? (
    <tbody ref={ref} {...props} />
  ) : (
    <tbody ref={ref} style={emptyDesktopSectionStyle}></tbody>
  )
}

const TransactionContainerMobile = props => {
  return <div {...props} />
}

/**
 * Groups transactions by date and renders them as a list
 * On desktop, the section headers will not be shown
 */
const TransactionSections = props => {
  const { filteringOnAccount, className, transactions, onRowRef } = props

  const { isDesktop, isExtraLarge } = useBreakpoints()

  const transactionsGrouped = useMemo(() => groupByDate(transactions), [
    transactions
  ])
  const Section = isDesktop ? VisibleSectionDesktop : SectionMobile
  const TransactionContainer = isDesktop ? Table : TransactionContainerMobile
  const Row = isDesktop ? TransactionRowDesktop : TransactionRowMobile

  return (
    <TransactionContainer className={cx(styles.TransactionTable, className)}>
      {transactionsGrouped.map((dateAndGroup, id) => {
        const date = dateAndGroup[0]
        const transactionGroup = dateAndGroup[1]
        return (
          <Section date={date} key={id} initialVisible={id < 10}>
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
      showTriggerErrors,
      filteringOnAccount,
      className,
      transactions,
      TransactionSections,
      onReachTop,
      onReachBottom,
      canFetchMore
    } = this.props

    return (
      <InfiniteScroll
        manual={false}
        canLoadAtTop={false}
        canLoadAtBottom={canFetchMore}
        onReachTop={onReachTop}
        onReachBottom={onReachBottom}
        getScrollingElement={this.getScrollingElement}
        onScroll={this.handleScroll}
      >
        {showTriggerErrors ? <TransactionPageErrors /> : null}
        <TransactionSections
          filteringOnAccount={filteringOnAccount}
          className={className}
          transactions={transactions}
          onRowRef={this.handleRefRow}
        />
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
