import React, { Component, Fragment } from 'react'
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { translate, withBreakpoints } from 'cozy-ui/transpiled/react'
import Loading from 'components/Loading'
import { Padded } from 'components/Spacing'
import {
  resetFilterByDoc,
  addFilterByPeriod,
  getFilteringDoc,
  getTransactionsFilteredByAccount
} from 'ducks/filters'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import Categories from 'ducks/categories/Categories'
import { flowRight as compose, sortBy, some, includes } from 'lodash'
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
import { getTracker } from 'ducks/tracking/browser'

const isCategoryDataEmpty = categoryData => {
  return categoryData[0] && isNaN(categoryData[0].percentage)
}

class CategoriesPage extends Component {
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
    const tracker = getTracker()
    tracker.trackPage(
      `analyse:${categoryName ? categoryName : 'home'}${
        subcategoryName ? `:${subcategoryName}` : ''
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

  selectCategory = (selectedCategory, subcategory) => {
    if (subcategory) {
      this.props.router.push(`/categories/${selectedCategory}/${subcategory}`)
    } else if (selectedCategory) {
      this.props.router.push(`/categories/${selectedCategory}`)
    } else {
      this.props.router.push('/categories')
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
      t,
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
    const selectedCategoryName = router.params.categoryName
    const categories = showIncomeCategory
      ? categoriesProps
      : categoriesProps.filter(category => category.name !== 'incomeCat')
    const breadcrumbItems = [{ name: t('Categories.title.general') }]
    if (selectedCategoryName) {
      breadcrumbItems[0].onClick = () => router.push('/categories')
      breadcrumbItems.push({
        name: t(`Data.categories.${selectedCategoryName}`)
      })
    }
    const selectedCategory = categories.find(
      category => category.name === selectedCategoryName
    )

    const sortedCategories = sortBy(categories, cat =>
      Math.abs(cat.amount)
    ).reverse()
    const hasAccount = accounts.data && accounts.data.length > 0

    return (
      <Fragment>
        <BarTheme theme="primary" />
        <CategoriesHeader
          breadcrumbItems={breadcrumbItems}
          selectedCategory={selectedCategory}
          withIncome={showIncomeCategory}
          onWithIncomeToggle={this.onWithIncomeToggle}
          categories={sortedCategories}
          isFetching={isFetching}
          hasAccount={hasAccount}
        />
        {hasAccount &&
          (isFetching ? (
            <Padded className="u-pt-0">
              <Loading loadingType="categories" />
            </Padded>
          ) : (
            <Categories
              categories={sortedCategories}
              selectedCategory={selectedCategory}
              selectedCategoryName={selectedCategoryName}
              selectCategory={this.selectCategory}
              withIncome={showIncomeCategory}
              filterWithInCome={this.filterWithInCome}
            />
          ))}
      </Fragment>
    )
  }
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
  withBreakpoints(),
  translate(),
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
