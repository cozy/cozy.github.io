import React, { Component, Fragment } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import Loading from 'components/Loading'
import Padded from 'components/Padded'
import {
  resetFilterByDoc,
  addFilterByPeriod,
  getFilteringDoc,
  getTransactionsFilteredByAccount
} from 'ducks/filters'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import Categories from 'ducks/categories/Categories'
import includes from 'lodash/includes'
import some from 'lodash/some'
import sortBy from 'lodash/sortBy'
import compose from 'lodash/flowRight'
import CategoriesHeader from 'ducks/categories/CategoriesHeader'
import {
  withClient,
  queryConnect,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import {
  accountsConn,
  settingsConn,
  transactionsConn,
  groupsConn
} from 'doctypes'
import BarTheme from 'ducks/bar/BarTheme'
import { getCategoriesData } from 'ducks/categories/selectors'
import maxBy from 'lodash/maxBy'
import { getDate } from 'ducks/transactions/helpers'
import { trackPage } from 'ducks/tracking/browser'
import { TransactionsPageWithBackButton } from 'ducks/transactions'
import { onSubcategory } from './utils'
import Delayed from 'components/Delayed'

const isCategoryDataEmpty = categoryData => {
  return categoryData[0] && isNaN(categoryData[0].percentage)
}

const goToCategory = (router, selectedCategory, subcategory) => {
  if (subcategory) {
    router.push(`/analysis/categories/${selectedCategory}/${subcategory}`)
  } else if (selectedCategory) {
    router.push(`/analysis/categories/${selectedCategory}`)
  } else {
    router.push('/analysis/categories')
  }
}

export class CategoriesPage extends Component {
  componentDidMount() {
    const { filteringDoc, resetFilterByDoc } = this.props
    if (
      filteringDoc &&
      includes(['Reimbursements', 'health_reimbursements'], filteringDoc._id)
    ) {
      resetFilterByDoc()
    }
    this.checkToChangeFilter()
    this.trackPage()
  }

  trackPage() {
    const { router } = this.props
    const { categoryName, subcategoryName } = router.params
    trackPage(
      `analyse:${categoryName ? categoryName : 'home'}${
        subcategoryName ? `:details` : ''
      }`
    )
  }

  componentDidUpdate(prevProps) {
    const prevParams = prevProps.router.params
    const curParams = this.props.router.params
    if (
      !prevProps.transactions.lastUpdate &&
      this.props.transactions.lastUpdate
    ) {
      this.checkToChangeFilter()
    } else if (prevParams.categoryName !== curParams.categoryName) {
      this.trackPage()
    }
  }

  checkToChangeFilter() {
    // If we do not have any data to show, change the period filter
    // to the latest period available for the current account
    if (isCategoryDataEmpty(this.props.categories)) {
      const transactions = this.props.filteredTransactionsByAccount
      if (transactions && transactions.length > 0) {
        const maxDate = getDate(maxBy(transactions, getDate))
        this.props.addFilterByPeriod(maxDate.slice(0, 7))
      }
    }
  }

  onWithIncomeToggle = checked => {
    const { client } = this.props
    const settings = this.getSettings()

    settings.showIncomeCategory = checked

    client.save(settings)
  }

  getSettings = () => {
    const { settings: settingsCollection } = this.props

    return getDefaultedSettingsFromCollection(settingsCollection)
  }

  render() {
    const {
      categories: categoriesProps,
      transactions,
      router,
      accounts,
      settings
    } = this.props
    const isFetching = some(
      [accounts, transactions, settings],
      col => isQueryLoading(col) && !hasQueryBeenLoaded(col)
    )
    const { showIncomeCategory } = this.getSettings()
    const categories = showIncomeCategory
      ? categoriesProps
      : categoriesProps.filter(category => category.name !== 'incomeCat')

    const categoryName = router.params.categoryName
    const subcategoryName = router.params.subcategoryName

    const selectedCategory = categories.find(
      category => category.name === categoryName
    )

    const sortedCategories = sortBy(categories, cat =>
      Math.abs(cat.amount)
    ).reverse()
    const hasAccount = accounts.data && accounts.data.length > 0

    const isSubcategory = onSubcategory(router.params)

    return (
      <Fragment>
        <BarTheme theme="primary" />
        <CategoriesHeader
          categoryName={categoryName}
          subcategoryName={subcategoryName}
          selectedCategory={selectedCategory}
          withIncome={showIncomeCategory}
          onWithIncomeToggle={this.onWithIncomeToggle}
          categories={sortedCategories}
          isFetching={isFetching}
          hasAccount={hasAccount}
          chart={!isSubcategory}
        />
        <Delayed delay={this.props.delayContent}>
          {hasAccount &&
            (isFetching ? (
              <Padded className="u-pt-0">
                <Loading loadingType="categories" />
              </Padded>
            ) : !isSubcategory ? (
              <Categories
                categories={sortedCategories}
                selectedCategory={selectedCategory}
                selectedCategoryName={categoryName}
                selectCategory={(selectedCategory, subcategory) =>
                  goToCategory(router, selectedCategory, subcategory)
                }
                withIncome={showIncomeCategory}
                filterWithInCome={this.filterWithInCome}
              />
            ) : (
              <TransactionsPageWithBackButton
                className="u-pt-0"
                showFutureBalance={false}
                showTriggerErrors={false}
                showHeader={false}
              />
            ))}
        </Delayed>
      </Fragment>
    )
  }
}

CategoriesPage.defaultProps = {
  delayContent: 0
}

const mapDispatchToProps = dispatch => ({
  resetFilterByDoc: () => dispatch(resetFilterByDoc()),
  addFilterByPeriod: period => dispatch(addFilterByPeriod(period))
})

const mapStateToProps = (state, ownProps) => {
  return {
    categories: getCategoriesData(state, ownProps),
    filteringDoc: getFilteringDoc(state),
    filteredTransactionsByAccount: getTransactionsFilteredByAccount(state)
  }
}

export default compose(
  withRouter,
  withClient,
  queryConnect({
    accounts: accountsConn,
    transactions: transactionsConn,
    settings: settingsConn,
    groups: groupsConn
  }),
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(CategoriesPage)
