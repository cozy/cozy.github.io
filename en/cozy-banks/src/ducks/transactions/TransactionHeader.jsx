import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'
import { translate, withBreakpoints, useI18n } from 'cozy-ui/transpiled/react'
import CozyTheme from 'cozy-ui/transpiled/react/CozyTheme'
import cx from 'classnames'

import AnalysisTabs from 'ducks/analysis/AnalysisTabs'
import Breadcrumb from 'cozy-ui/transpiled/react/Breadcrumbs'
import { ConnectedSelectDates } from 'components/SelectDates'
import { BalanceDetailsHeader } from 'ducks/balance'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { ConnectedHistoryChart as HistoryChart } from 'ducks/balance/HistoryChart'
import { Padded } from 'components/Spacing'

import withSize from 'components/withSize'
import TableHead from './header/TableHead'
import styles from './TransactionsHeader.styl'

const HeaderBreadcrumb = ({ router }) => {
  const { t } = useI18n()
  const { categoryName, subcategoryName } = router.params
  const breadcrumbItems = [
    {
      name: t('Categories.title.general'),
      onClick: () => router.push('/categories')
    },
    {
      name: t(`Data.categories.${categoryName}`),
      onClick: () => router.push(`/categories/${categoryName}`)
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

class TransactionHeader extends Component {
  static propTypes = {
    showBackButton: PropTypes.bool
  }

  isSubcategory = () => {
    const { router } = this.props

    return router.params.subcategoryName !== undefined
  }

  renderSelectDates = () => {
    if (this.isSubcategory()) {
      return <ConnectedSelectDates showFullYear color="primary" />
    }

    const { transactions, handleChangeMonth, currentMonth } = this.props

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

  renderBalanceHistory() {
    const {
      breakpoints: { isMobile },
      size,
      currentMonth
    } = this.props
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

  render() {
    const {
      transactions,
      breakpoints: { isMobile },
      router,
      showBalance,
      t
    } = this.props
    const isSubcategory = this.isSubcategory()

    return (
      <BalanceDetailsHeader small={isSubcategory} showBalance={showBalance}>
        {isSubcategory ? (
          isMobile ? (
            <AnalysisTabs />
          ) : null
        ) : (
          this.renderBalanceHistory()
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
          {this.renderSelectDates()}
        </Padded>
        {isSubcategory && !isMobile && (
          <Padded className="u-pt-0">
            <HeaderBreadcrumb router={router} t={t} />
          </Padded>
        )}
        <CozyTheme variant="inverted">
          {transactions.length > 0 && (
            <TableHead isSubcategory={isSubcategory} />
          )}
        </CozyTheme>
      </BalanceDetailsHeader>
    )
  }
}

export default compose(
  withRouter,
  withBreakpoints(),
  withSize(),
  translate()
)(TransactionHeader)
