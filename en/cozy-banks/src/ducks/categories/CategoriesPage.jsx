import React, { Component, Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import startOfYear from 'date-fns/start_of_year'
import endOfYear from 'date-fns/end_of_year'
import format from 'date-fns/format'

import includes from 'lodash/includes'
import maxBy from 'lodash/maxBy'
import some from 'lodash/some'
import merge from 'lodash/merge'
import sortBy from 'lodash/sortBy'

import getCategoryId from 'ducks/transactions/getCategoryId'
import { getCategoryIdFromName } from 'ducks/categories/helpers'
import CategoriesHeader from 'ducks/categories/CategoriesHeader'
import {
  useClient,
  isQueryLoading,
  hasQueryBeenLoaded,
  useQuery,
  Q
} from 'cozy-client'

import { useParams } from 'components/RouterContext'
import Loading from 'components/Loading'
import Padded from 'components/Padded'
import {
  resetFilterByDoc,
  addFilterByPeriod,
  getFilteringDoc,
  getPeriod
} from 'ducks/filters'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import Categories from 'ducks/categories/Categories'
import { accountsConn, settingsConn, groupsConn } from 'doctypes'

import { makeFilteredTransactionsConn } from 'ducks/transactions/queries'
import BarTheme from 'ducks/bar/BarTheme'
import { computeCategoriesData } from 'ducks/categories/selectors'
import { getDate } from 'ducks/transactions/helpers'
import { trackPage } from 'ducks/tracking/browser'
import { TransactionList } from 'ducks/transactions/Transactions'
import Delayed from 'components/Delayed'
import useLast from 'hooks/useLast'
import useFullyLoadedQuery from 'hooks/useFullyLoadedQuery'
import { onSubcategory } from './utils'

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

const CategoryTransactions = ({ transactions, subcategoryName }) => {
  const categoryTransactions = useMemo(() => {
    const categoryId = getCategoryIdFromName(subcategoryName)
    return transactions
      ? transactions.filter(t => {
          const tc = getCategoryId(t)
          return tc === categoryId
        })
      : []
  }, [subcategoryName, transactions])
  return (
    <div className="js-scrolling-element">
      <TransactionList
        showTriggerErrors={false}
        onChangeTopMostTransaction={null}
        onScroll={null}
        transactions={categoryTransactions}
        canFetchMore={false}
        filteringOnAccount={true}
        manualLoadMore={false}
        onReachBottom={null}
      />
    </div>
  )
}

export class CategoriesPage extends Component {
  componentDidMount() {
    const { filteringDoc, dispatch } = this.props
    if (
      filteringDoc &&
      includes(['Reimbursements', 'health_reimbursements'], filteringDoc._id)
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
    // if (
    //   !prevProps.transactions.lastUpdate &&
    //   this.props.transactions.lastUpdate
    // ) {
    //   this.checkToChangeFilter()
    // }

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
      router,
      accounts,
      settings,
      isFetching: isFetchingNewData
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
    const hasAccount = Boolean(accounts.data && accounts.data.length > 0)

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
                transactions={transactions.data}
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

const autoUpdateOptions = {
  add: false,
  remove: true,
  update: true
}

const addPeriodToConn = (baseConn, period) => {
  const { query: mkBaseQuery, as: baseAs, ...rest } = baseConn
  const d = new Date(period)
  const startDate = period.length === 7 ? startOfMonth(d) : startOfYear(d)
  const endDate = period.length === 7 ? endOfMonth(d) : endOfYear(d)
  const baseQuery = mkBaseQuery()
  const query = Q(baseQuery.doctype)
    .where(
      merge(
        {
          date: {
            $lte: format(endDate, 'YYYY-MM-DD'),
            $gte: format(startDate, 'YYYY-MM-DD')
          }
        },
        baseQuery.selector
      )
    )
    .indexFields(['date', 'account'])
    .sortBy([{ date: 'desc' }, { account: 'desc' }])
    .limitBy(500)
  const as = `${baseAs}-${format(startDate, 'YYYY-MM')}-${format(
    endDate,
    'YYYY-MM'
  )}`
  return {
    query,
    as,
    autoUpdate: autoUpdateOptions,
    ...rest
  }
}

const setAutoUpdate = conn => ({ ...conn, autoUpdate: autoUpdateOptions })

const enhance = Component => props => {
  const client = useClient()
  const params = useParams()
  const accounts = useQuery(accountsConn.query, accountsConn)
  const groups = useQuery(groupsConn.query, groupsConn)
  const settings = useQuery(settingsConn.query, settingsConn)

  const filteringDoc = useSelector(getFilteringDoc)
  const period = useSelector(getPeriod)
  const dispatch = useDispatch()

  const initialConn = makeFilteredTransactionsConn({
    groups,
    accounts,
    filteringDoc
  })
  const conn = useMemo(() => {
    return period
      ? addPeriodToConn(initialConn, period)
      : setAutoUpdate(initialConn)
  }, [initialConn, period])
  const transactions = useFullyLoadedQuery(conn.query, conn)

  // This is used for loaded transactions to stay rendered while
  // next/previous month transactions are loaded
  const col = useLast(transactions, (last, cur) => {
    return !last || (cur.lastUpdate && !cur.hasMore)
  })

  const categories = useMemo(() => {
    return computeCategoriesData(col.data || [])
  }, [col.data])
  return (
    <Component
      {...props}
      accounts={accounts}
      groups={groups}
      settings={settings}
      categories={categories}
      transactions={col}
      filteringDoc={filteringDoc}
      period={period}
      client={client}
      params={params}
      filteredTransactionsByAccount={col.data}
      dispatch={dispatch}
      isFetching={
        transactions.fetchStatus === 'loading' || transactions.hasMore
      }
    />
  )
}

export default enhance(CategoriesPage)
