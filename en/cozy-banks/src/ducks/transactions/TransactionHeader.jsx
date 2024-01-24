import React, { useMemo, memo } from 'react'
import PropTypes from 'prop-types'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import cx from 'classnames'

import { BalanceDetailsHeader } from 'ducks/balance'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { ConnectedHistoryChart as HistoryChart } from 'ducks/balance/HistoryChart'
import LegalMention from 'ducks/legal/LegalMention'

import Padded from 'components/Padded'
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
  const marginBottom = useMemo(() => (isMobile ? 48 : 64), [isMobile])
  const historyChartMargin = useMemo(
    () => ({
      top: 26,
      bottom: marginBottom,
      left: 0,
      right: isMobile ? 16 : 32
    }),
    [isMobile, marginBottom]
  )

  if (!size || !size.width) {
    return <div style={{ height }} />
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
  currentMonth,
  handleChangeMonth,
  size
}) => {
  const { isMobile } = useBreakpoints()
  return (
    <BalanceDetailsHeader showLegalMention={false}>
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
        <LegalMention className="u-mt-1" />
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

export default withSize()(memo(TransactionHeader))
