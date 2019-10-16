import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'
import { translate, withBreakpoints } from 'cozy-ui/react'
import cx from 'classnames'

import BackButton from 'components/BackButton'
import Breadcrumb from 'components/Breadcrumb'
import { ConnectedSelectDates } from 'components/SelectDates'
import { AccountSwitch } from 'ducks/account'
import TransactionSelectDates from 'ducks/transactions/TransactionSelectDates'
import { ConnectedHistoryChart as HistoryChart } from 'ducks/balance/HistoryChart'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'

import withSize from 'components/withSize'
import TableHead from './header/TableHead'
import styles from './TransactionsPage.styl'

const HeaderBreadcrumb = ({ t, router }) => {
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
      color="primary"
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

  renderAccountSwitch = () => {
    const isSubcategory = this.isSubcategory()
    return (
      <div className={styles.TransactionHeader__accountSwitchContainer}>
        {this.props.showBackButton && <BackButton theme="primary" arrow />}
        <AccountSwitch small={isSubcategory} color="primary" />
      </div>
    )
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
    if (!size) {
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
      t
    } = this.props
    const isSubcategory = this.isSubcategory()

    return (
      <Header color="primary" fixed>
        <Padded className={isMobile ? 'u-p-0' : 'u-pb-half'}>
          {this.renderAccountSwitch()}
        </Padded>
        {!isSubcategory && this.renderBalanceHistory()}
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
        {transactions.length > 0 && (
          <TableHead isSubcategory={isSubcategory} color="primary" />
        )}
      </Header>
    )
  }
}

export default compose(
  withRouter,
  withBreakpoints(),
  withSize(),
  translate()
)(TransactionHeader)
