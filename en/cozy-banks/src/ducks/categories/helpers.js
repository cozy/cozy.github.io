import parentCategory, {
  categoriesStyle,
  getCategoryIdFromName
} from 'ducks/categories/categoriesMap'
import categoryNames from 'ducks/categories/tree'
import getCategoryId from 'ducks/transactions/getCategoryId'

// eslint-disable-next-line no-unused-vars
import { BankTransaction, TransactionCategoriesSummary } from '../../types'

export const getParent = parentCategory.get.bind(parentCategory)

const makeCategory = parent => ({
  id: parent.id,
  name: parent.name,
  color: parent.color,
  transactions: [],
  subcategories: {}
})

const makeSubcategory = catId => ({
  id: catId,
  name: categoryNames[catId],
  transactions: []
})

export const isAwaitingCategorization = transaction => {
  return getCategoryId(transaction) === null
}

/**
 * @param  {Array<BankTransaction>} transactions
 * @return {TransactionCategoriesSummary}
 */
export const getTransactionsByCategory = transactions => {
  let categories = {}
  for (let catName of Object.keys(categoriesStyle)) {
    const category = { name: catName, ...categoriesStyle[catName] }
    categories[catName] = makeCategory(category)
  }

  for (const transaction of transactions) {
    // Ignore transactions that don't have a usable categorization yet
    if (isAwaitingCategorization(transaction)) {
      continue
    }
    // Creates a map of categories, where each entry contains a list of
    // related operations and a breakdown by sub-category
    const catId = getCategoryId(transaction)
    const parent = getParent(catId) || getParent('0')

    // create a new parent category if necessary
    // eslint-disable-next-line
    if (!categories.hasOwnProperty(parent.name)) {
      categories[parent.name] = makeCategory(parent)
    }
    const category = categories[parent.name]

    // create a new subcategory if necessary
    // eslint-disable-next-line
    if (!category.subcategories.hasOwnProperty(catId)) {
      category.subcategories[catId] = makeSubcategory(catId)
    }
    const subcategory = category.subcategories[catId]

    category.transactions.push(transaction)
    subcategory.transactions.push(transaction)
  }

  return categories
}

export const getParentCategory = transaction => {
  return getParent(getCategoryId(transaction))
}

export const isHealthExpense = transaction => {
  return getCategoryId(transaction) === '400610' && transaction.amount < 0
}

export const isHealth = transaction => {
  const categoryId = getCategoryId(transaction)
  return (
    categoryId === '400600' ||
    categoryId === '400610' ||
    categoryId === '400620'
  )
}

const subCategorySort = (a, b) => {
  if (b.percentage !== a.percentage) {
    return b.percentage - a.percentage
  } else {
    return a.amount - b.amount
  }
}

export const getTransactionsTotal = categories => {
  let transactionsTotal = 0

  if (categories.length !== 0) {
    // compute some global data
    const absoluteTransactionsTotal = categories.reduce(
      (total, category) => total + Math.abs(category.amount),
      0
    )
    for (let category of categories) {
      category.percentage = Math.round(
        (Math.abs(category.amount) / absoluteTransactionsTotal) * 100
      )
      const absoluteSubcategoriesTotal = category.subcategories.reduce(
        (total, category) => total + Math.abs(category.amount),
        0
      )
      for (let subcategory of category.subcategories) {
        if (absoluteSubcategoriesTotal === 0) {
          subcategory.percentage = 100
        } else {
          subcategory.percentage = Math.round(
            (Math.abs(subcategory.amount) / absoluteSubcategoriesTotal) * 100
          )
        }
      }
      category.subcategories = category.subcategories.sort(subCategorySort)
      transactionsTotal += category.amount
    }
  }

  return transactionsTotal
}

export const getGlobalCurrency = categories => {
  let currency

  if (categories.length > 0) {
    currency = categories[0].currency
  }

  if (!currency) {
    currency = '€'
  }

  return currency
}

export const isProfessionalExpense = transaction => {
  return (
    getCategoryId(transaction) ===
      getCategoryIdFromName('professionalExpenses') && transaction.amount < 0
  )
}

export { getCategoryIdFromName }
