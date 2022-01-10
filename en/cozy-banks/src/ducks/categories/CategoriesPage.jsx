import React, { Component } from 'react'
import includes from 'lodash/includes'
import maxBy from 'lodash/maxBy'
import some from 'lodash/some'
import sortBy from 'lodash/sortBy'

import { isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'

import Loading from 'components/Loading'
import Padded from 'components/Padded'
import Delayed from 'components/Delayed'
import { resetFilterByDoc, addFilterByPeriod } from 'ducks/filters'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import BarTheme from 'ducks/bar/BarTheme'
import { getDate } from 'ducks/transactions/helpers'
import { trackPage } from 'ducks/tracking/browser'
import CategoriesHeader from 'ducks/categories/CategoriesHeader'
import Categories from 'ducks/categories/Categories'
import { onSubcategory } from 'ducks/categories/utils'
import CategoryTransactions from 'ducks/categories/CategoriesPage/CategoryTransactions'
import enhanceCategoriesPage from 'ducks/categories/CategoriesPage/enhanceCategoriesPage'

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
    const { filteringDoc, dispatch } = this.props
    if (
      filteringDoc &&
      includes(
        [
          'professional_reimbursements',
          'others_reimbursements',
          'health_reimbursements'
        ],
        filteringDoc._id
      )
    ) {
      dispatch(resetFilterByDoc())
    }
    this.checkToChangeFilter()
    this.trackPage()
  }

  trackPage() {
    const { params } = this.props
    const { categoryName, subcategoryName } = params
    trackPage(
      `analyse:${categoryName ? categoryName : 'home'}${
        subcategoryName ? `:details` : ''
      }`
    )
  }

  componentDidUpdate(prevProps) {
    const prevParams = prevProps.params
    const curParams = this.props.params

    if (prevParams.categoryName !== curParams.categoryName) {
      this.trackPage()
    }
  }

  checkToChangeFilter() {
    const { categories, filteredTransactionsByAccount, dispatch } = this.props
    // If we do not have any data to show, change the period filter
    // to the latest period available for the current account
    if (isCategoryDataEmpty(categories)) {
      const transactions = filteredTransactionsByAccount
      if (transactions && transactions.length > 0) {
        const maxDate = getDate(maxBy(transactions, getDate))
        dispatch(addFilterByPeriod(maxDate.slice(0, 7)))
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
      transactionsByApplicationDate,
      router,
      accounts,
      settings,
      isFetching: isFetchingNewData,
      filteredTransactionsByAccount
    } = this.props
    const isFetching = some(
      [accounts, transactions, settings, transactionsByApplicationDate],
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
    const hasAccount = Boolean(accounts.data && accounts.data.length > 0)

    const isSubcategory = onSubcategory(router.params)

    return (
      <>
        <BarTheme theme="primary" />
        <CategoriesHeader
          categoryName={categoryName}
          subcategoryName={subcategoryName}
          selectedCategory={selectedCategory}
          withIncome={showIncomeCategory}
          onWithIncomeToggle={this.onWithIncomeToggle}
          categories={sortedCategories}
          isFetching={isFetching}
          isFetchingNewData={isFetchingNewData}
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
              <CategoryTransactions
                subcategoryName={router.params.subcategoryName}
                transactions={filteredTransactionsByAccount}
              />
            ))}
        </Delayed>
      </>
    )
  }
}

CategoriesPage.defaultProps = {
  delayContent: 0
}

export default enhanceCategoriesPage(CategoriesPage)
