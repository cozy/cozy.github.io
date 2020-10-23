import React from 'react'
import PropTypes from 'prop-types'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import cx from 'classnames'

import { BalanceDetailsHeader } from 'ducks/balance'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { ConnectedHistoryChart as HistoryChart } from 'ducks/balance/HistoryChart'
import { Padded } from 'components/Spacing'

import withSize from 'components/withSize'
import TableHead from './header/TableHead'
import styles from './TransactionsHeader.styl'

const TransactionHeaderSelectDates = ({
  transactions,
  handleChangeMonth,
  currentMonth
}) => {
  return (
    <TransactionSelectDates
      transactions={transactions}
      value={currentMonth}
      onChange={handleChangeMonth}
      color="primary"
      className="u-p-0"
    />
  )
}

const TransactionHeaderBalanceHistory = ({ size, currentMonth }) => {
  const { isMobile } = useBreakpoints()
  const height = isMobile ? 66 : 96
  if (!size || !size.width) {
    return <div style={{ height }} />
  }
  const marginBottom = isMobile ? 48 : 64
  const historyChartMargin = {
    top: 26,
    bottom: marginBottom,
    left: 0,
    right: isMobile ? 16 : 32
  }

  return (
    <HistoryChart
      animation={false}
      margin={historyChartMargin}
      currentMonth={currentMonth}
      height={height + marginBottom}
      minWidth={size.width}
      className={styles.TransactionsHeader__chart}
    />
  )
}

const TransactionHeader = ({
  transactions,
  showBalance,
  currentMonth,
  handleChangeMonth,
  size
}) => {
  const { isMobile } = useBreakpoints()
  return (
    <BalanceDetailsHeader showBalance={showBalance}>
      <TransactionHeaderBalanceHistory
        currentMonth={currentMonth}
        size={size}
      />
      <Padded
        className={cx(
          {
            'u-ph-half': isMobile,
            'u-pv-0': isMobile,
            'u-pb-half': isMobile
          },
          styles.TransactionsHeader__selectDatesContainer
        )}
      >
        <TransactionHeaderSelectDates
          transactions={transactions}
          handleChangeMonth={handleChangeMonth}
          currentMonth={currentMonth}
        />
      </Padded>
      <CozyTheme variant="inverted">
        {transactions.length > 0 && <TableHead />}
      </CozyTheme>
    </BalanceDetailsHeader>
  )
}

TransactionHeader.propTypes = {
  showBackButton: PropTypes.bool
}

export default withSize()(TransactionHeader)
