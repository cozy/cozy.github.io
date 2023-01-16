import React, { Component } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const goToCategory = (navigate, selectedCategory, subcategory) => {
  if (subcategory) {
    navigate(`/analysis/categories/${selectedCategory}/${subcategory}`)
  } else if (selectedCategory) {
    navigate(`/analysis/categories/${selectedCategory}`)
  } else {
    navigate('/analysis/categories')
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
      navigate,
      params,
      accounts,
      settings,
      isFetching: isFetchingNewData,
      filteredTransactionsByAccount,
      setSelectedTags,
      selectedTags
    } = this.props
    const isFetching = some(
      [accounts, transactions, settings, transactionsByApplicationDate],
      col => isQueryLoading(col) && !hasQueryBeenLoaded(col)
    )

    const { showIncomeCategory } = this.getSettings()
    const categories = showIncomeCategory
      ? categoriesProps
      : categoriesProps.filter(category => category.name !== 'incomeCat')

    const categoryName = params.categoryName
    const subcategoryName = params.subcategoryName

    const selectedCategory = categories.find(
      category => category.name === categoryName
    )

    const sortedCategories = sortBy(categories, cat =>
      Math.abs(cat.amount)
    ).reverse()
    const hasAccount = Boolean(accounts.data && accounts.data.length > 0)

    const isSubcategory = onSubcategory(params)

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
          setSelectedTags={setSelectedTags}
          selectedTags={selectedTags}
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
                  goToCategory(navigate, selectedCategory, subcategory)
                }
                withIncome={showIncomeCategory}
                filterWithInCome={this.filterWithInCome}
              />
            ) : (
              <CategoryTransactions
                subcategoryName={params.subcategoryName}
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

const CategoriesPageWrapper = ({ children, ...props }) => {
  const navigate = useNavigate()
  const params = useParams()
  return (
    <CategoriesPage navigate={navigate} params={params} {...props}>
      {children}
    </CategoriesPage>
  )
}

export default enhanceCategoriesPage(CategoriesPageWrapper)
