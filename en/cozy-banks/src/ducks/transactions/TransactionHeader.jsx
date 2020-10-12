import React from 'react'
import PropTypes from 'prop-types'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import Breadcrumb from 'cozy-ui/transpiled/react/Breadcrumbs'
import { useParams, useHistory } from 'components/RouterContext'
import cx from 'classnames'

import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import { ConnectedSelectDates } from 'components/SelectDates'
import { BalanceDetailsHeader } from 'ducks/balance'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { ConnectedHistoryChart as HistoryChart } from 'ducks/balance/HistoryChart'
import { Padded } from 'components/Spacing'

import withSize from 'components/withSize'
import TableHead from './header/TableHead'
import styles from './TransactionsHeader.styl'

const HeaderBreadcrumb = () => {
  const { t } = useI18n()
  const { categoryName, subcategoryName } = useParams()
  const history = useHistory()

  const breadcrumbItems = [
    {
      name: t('Categories.title.general'),
      onClick: () => history.push('/categories')
    },
    {
      name: t(`Data.categories.${categoryName}`),
      onClick: () => history.push(`/categories/${categoryName}`)
    },
    {
      name: t(`Data.subcategories.${subcategoryName}`)
    }
  ]

  return (
    <Breadcrumb
      items={breadcrumbItems}
      className={styles.TransactionPage__Breadcrumb}
      theme="primary"
    />
  )
}
const onSubcategory = params => {
  return params.subcategoryName !== undefined
}

const TransactionHeaderSelectDates = ({
  transactions,
  handleChangeMonth,
  currentMonth
}) => {
  const params = useParams()
  if (onSubcategory(params)) {
    return <ConnectedSelectDates showFullYear color="primary" />
  }

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
  const params = useParams()
  const isSubcategory = onSubcategory(params)

  return (
    <BalanceDetailsHeader small={isSubcategory} showBalance={showBalance}>
      {isSubcategory ? (
        isMobile ? (
          <AnalysisTabs />
        ) : null
      ) : (
        <TransactionHeaderBalanceHistory
          currentMonth={currentMonth}
          size={size}
        />
      )}
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
      {isSubcategory && !isMobile && (
        <Padded className="u-pt-0">
          <HeaderBreadcrumb />
        </Padded>
      )}
      <CozyTheme variant="inverted">
        {transactions.length > 0 && <TableHead isSubcategory={isSubcategory} />}
      </CozyTheme>
    </BalanceDetailsHeader>
  )
}

TransactionHeader.propTypes = {
  showBackButton: PropTypes.bool
}

export default withSize()(TransactionHeader)
