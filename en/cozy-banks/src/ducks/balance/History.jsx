import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { format as formatDate, subYears, isAfter } from 'date-fns'
import memoize from 'lodash/memoize'
import max from 'lodash/max'
import groupBy from 'lodash/groupBy'
import uniq from 'lodash/uniq'
import compose from 'lodash/flowRight'
import cx from 'classnames'

import { isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from 'ducks/balance/History.styl'
import HistoryChart from 'ducks/balance/HistoryChart'
import * as d3 from 'utils/d3'
import {
  getBalanceHistories,
  sumBalanceHistories,
  balanceHistoryToChartData
} from 'ducks/balance/helpers'
import withSize from 'components/withSize'

const today = new Date()
const oneYearBefore = subYears(today, 1)

const HISTORY_MOBILE_HEIGHT = 95
const HISTORY_DESKTOP_HEIGHT = 141

/**
 * Component that is displayed while we wait a bit to start the
 * animation.
 *
 * It should have the same height as the normal history component
 * to prevent any jump of the page when the history component
 * finally appears.
 */
export const HistoryFallback = () => {
  const { isMobile } = useBreakpoints()
  const height = isMobile ? HISTORY_MOBILE_HEIGHT : HISTORY_DESKTOP_HEIGHT
  return <div className={styles.History} style={{ height }} />
}

class History extends Component {
  constructor(props, context) {
    super(props, context)
    this.getTransactionsFilteredHelper = memoize(
      this.getTransactionsFilteredHelper
    )
  }
  getBalanceHistory(accounts, transactions) {
    const balanceHistories = getBalanceHistories(
      accounts,
      transactions,
      today,
      oneYearBefore
    )
    const balanceHistory = sumBalanceHistories(Object.values(balanceHistories))

    return balanceHistory
  }

  getTransactionsFiltered() {
    const { transactions } = this.props

    return this.getTransactionsFilteredHelper(transactions)
  }

  getTransactionsFilteredHelper(transactions) {
    const filteredTransactions = transactions.data.filter(t => {
      // Use .date as to get the debit date
      return t && t.date && isAfter(new Date(t.date), oneYearBefore)
    })
    return {
      ...transactions,
      data: filteredTransactions
    }
  }

  getChartData() {
    const { accounts } = this.props
    const transactions = this.getTransactionsFiltered()
    const history = this.getBalanceHistory(accounts, transactions.data)
    const data = balanceHistoryToChartData(history)

    return data
  }

  getChartProps() {
    const {
      breakpoints: { isMobile },
      size: { width },
      animation
    } = this.props

    const data = this.getChartData()
    const nbTicks = uniq(
      Object.keys(groupBy(data, i => formatDate(i.x, 'YYYY-MM')))
    ).length

    const intervalBetweenMonths = isMobile ? 52 : 89
    const TICK_FORMAT = d3.timeFormat('%b')

    const chartProps = {
      data,
      nbTicks,
      width: max([width, nbTicks * intervalBetweenMonths]),
      height: isMobile ? HISTORY_MOBILE_HEIGHT : HISTORY_DESKTOP_HEIGHT,
      margin: {
        top: 26,
        bottom: 35,
        left: 0,
        right: isMobile ? 16 : 32
      },
      showAxis: true,
      axisMargin: 10,
      tickFormat: TICK_FORMAT,
      animation: animation
    }

    return chartProps
  }

  render() {
    const {
      transactions,
      className,
      size: { width }
    } = this.props

    const hasWidth = width !== undefined

    const isTransactionsLoading =
      isQueryLoading(transactions) && !hasQueryBeenLoaded(transactions)

    return (
      <div className={cx(styles.History, className)}>
        {isTransactionsLoading || !hasWidth ? (
          <Spinner size="xxlarge" color="white" />
        ) : (
          <HistoryChart {...this.getChartProps()} />
        )}
      </div>
    )
  }
}

History.propTypes = {
  accounts: PropTypes.array.isRequired,
  className: PropTypes.string,
  transactions: PropTypes.object.isRequired
}

export default compose(withBreakpoints(), withSize())(History)
