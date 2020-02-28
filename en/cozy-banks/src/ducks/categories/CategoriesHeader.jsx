import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import Toggle from 'cozy-ui/transpiled/react/Toggle'
import Breadcrumb from 'components/Breadcrumb'
import { AccountSwitch } from 'ducks/account'
import BackButton from 'components/BackButton'
import Header from 'components/Header'
import { Padded } from 'components/Spacing'
import { ConnectedSelectDates as SelectDates } from 'components/SelectDates'
import CategoriesChart from 'ducks/categories/CategoriesChart'
import {
  getTransactionsTotal,
  getGlobalCurrency
} from 'ducks/categories/helpers'
import { flowRight as compose } from 'lodash'
import styles from 'ducks/categories/CategoriesHeader.styl'
import AddAccountButton from 'ducks/categories/AddAccountButton'

class CategoriesHeader extends PureComponent {
  renderAccountSwitch = () => {
    const { selectedCategory, breadcrumbItems } = this.props
    const [previousItem] = breadcrumbItems.slice(-2, 1)
    return (
      <Fragment>
        <AccountSwitch small={selectedCategory !== undefined} color="primary" />
        {selectedCategory && (
          <BackButton
            onClick={
              previousItem && previousItem.onClick
                ? previousItem.onClick
                : undefined
            }
            theme="primary"
          />
        )}
      </Fragment>
    )
  }

  renderIncomeToggle = () => {
    const {
      selectedCategory,
      withIncome,
      onWithIncomeToggle,
      breakpoints: { isMobile },
      categories,
      t
    } = this.props
    const hasData =
      categories.length > 0 && categories[0].transactionsNumber > 0
    const showIncomeToggle = hasData && selectedCategory === undefined

    if (!showIncomeToggle) {
      return null
    }
    const color = !isMobile ? 'primary' : 'default'

    return (
      <div className={cx(styles.CategoriesHeader__Toggle, styles[color])}>
        <Toggle
          id="withIncome"
          checked={withIncome}
          onToggle={onWithIncomeToggle}
        />
        <label htmlFor="withIncome">
          {t('Categories.filter.includeIncome')}
        </label>
      </div>
    )
  }

  renderChart = () => {
    const {
      selectedCategory,
      chartSize = 182,
      categories,
      breakpoints: { isMobile },
      t,
      hasAccount,
      isFetching
    } = this.props
    const globalCurrency = getGlobalCurrency(categories)
    const transactionsTotal = getTransactionsTotal(categories)

    if (isFetching) {
      return null
    }

    const color = { color: !isMobile ? 'primary' : 'default' }
    const className = hasAccount
      ? undefined
      : { className: styles.NoAccount_chart }

    return (
      <CategoriesChart
        width={chartSize}
        height={chartSize}
        categories={
          selectedCategory ? selectedCategory.subcategories : categories
        }
        selectedCategory={selectedCategory}
        total={selectedCategory ? selectedCategory.amount : transactionsTotal}
        currency={globalCurrency}
        label={t('Categories.title.total')}
        hasAccount={hasAccount}
        {...color}
        {...className}
      />
    )
  }

  render() {
    const {
      breadcrumbItems,
      hasAccount,
      breakpoints: { isMobile },
      t
    } = this.props

    const accountSwitch = this.renderAccountSwitch()
    const incomeToggle = this.renderIncomeToggle()
    const chart = this.renderChart()

    if (isMobile) {
      return (
        <Fragment>
          <Header fixed color="primary">
            <SelectDates showFullYear color="primary" />
          </Header>
          {accountSwitch}
          {hasAccount ? (
            <Header color="default" className="u-mt-3">
              <Padded>
                {incomeToggle}
                {chart}
              </Padded>
            </Header>
          ) : (
            <Header
              color="default"
              className={cx(styles.NoAccount_container, 'u-mt-3')}
            >
              <Padded className={styles.NoAccount_box}>
                {chart}
                <AddAccountButton absolute label={t('Accounts.add_bank')} />
              </Padded>
            </Header>
          )}
        </Fragment>
      )
    }

    return (
      <Header color="primary">
        <Padded
          className={cx(styles.CategoriesHeader, {
            [styles.NoAccount]: !hasAccount
          })}
        >
          <div>
            <Padded className="u-ph-0 u-pt-0 u-pb-half">{accountSwitch}</Padded>
            <Padded className="u-pv-1 u-ph-0">
              <SelectDates showFullYear color="primary" />
            </Padded>
            {breadcrumbItems.length > 1 && (
              <Breadcrumb
                items={breadcrumbItems}
                className={cx(
                  styles.CategoriesHeader__Breadcrumb,
                  styles.primary
                )}
                color="primary"
              />
            )}
            {incomeToggle}
          </div>
          {chart}
          {!hasAccount && <AddAccountButton label={t('Accounts.add_bank')} />}
        </Padded>
      </Header>
    )
  }
}

CategoriesHeader.propTypes = {
  breadcrumbItems: PropTypes.array.isRequired,
  selectedCategory: PropTypes.object,
  withIncome: PropTypes.bool.isRequired,
  onWithIncomeToggle: PropTypes.func.isRequired,
  chartSize: PropTypes.number,
  hasAccount: PropTypes.bool.isRequired,
  categories: PropTypes.array.isRequired,
  t: PropTypes.func.isRequired,
  breakpoints: PropTypes.object.isRequired
}

export default compose(
  translate(),
  withBreakpoints()
)(CategoriesHeader)
