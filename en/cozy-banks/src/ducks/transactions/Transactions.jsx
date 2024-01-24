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
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import ListSubheader from 'cozy-ui/transpiled/react/ListSubheader'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { Table } from 'components/Table'
import TransactionPageErrors from 'ducks/transactions/TransactionPageErrors'
import styles from 'ducks/transactions/Transactions.styl'
import { InfiniteScroll, TopMost } from 'ducks/transactions/scroll'
import TransactionRowMobile from 'ducks/transactions/TransactionRow/TransactionRowMobile'
import TransactionRowDesktop from 'ducks/transactions/TransactionRow/TransactionRowDesktop'
import { getDate } from 'ducks/transactions/helpers'
import useVisible from 'hooks/useVisible'
import SelectionBar from 'ducks/selection/SelectionBar'
import { useSelectionContext } from 'ducks/context/SelectionContext'
import getScrollingElement from './scroll/getScrollingElement'

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
const TransactionSections = ({
  filteringOnAccount,
  className,
  transactions,
  onRowRef
}) => {
  const { isDesktop, isExtraLarge } = useBreakpoints()
  const { isSelected, isSelectionModeActive, toggleSelection } =
    useSelectionContext()

  const transactionsGrouped = useMemo(
    () => groupByDate(transactions),
    [transactions]
  )
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
            {transactionGroup.map((transaction, index) => {
              return (
                <Row
                  key={transaction._id}
                  onRef={onRowRef}
                  transaction={transaction}
                  isExtraLarge={isExtraLarge}
                  filteringOnAccount={filteringOnAccount}
                  isSelected={isSelected(transaction)}
                  isSelectionModeActive={isSelectionModeActive}
                  toggleSelection={toggleSelection}
                  hasDivider={
                    transactionGroup.length > 1 &&
                    index !== transactionGroup.length - 1
                  }
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

  componentWillUnmount() {
    const { emptyAndDeactivateSelection } = this.props
    emptyAndDeactivateSelection()
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
    return getScrollingElement(isDesktop)
  }

  render() {
    const {
      showTriggerErrors,
      filteringOnAccount,
      className,
      TransactionSections,
      onReachTop,
      onReachBottom,
      canFetchMore
    } = this.props

    return (
      <>
        <SelectionBar transactions={this.transactions} />
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
            transactions={this.transactions}
            onRowRef={this.handleRefRow}
          />
        </InfiniteScroll>
      </>
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

export const TransactionList = props => {
  const { emptyAndDeactivateSelection } = useSelectionContext()
  const breakpoints = useBreakpoints()

  return (
    <TransactionsDumb
      emptyAndDeactivateSelection={emptyAndDeactivateSelection}
      breakpoints={breakpoints}
      {...props}
    />
  )
}
