import flag from 'cozy-flags'
import parentCategory, { categoriesStyle } from 'ducks/categories/categoriesMap'
import categoryNames from 'ducks/categories/tree'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { BankTransaction } from 'cozy-doctypes'

const getParent = parentCategory.get.bind(parentCategory)

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

/**
 * Return the category id of the transaction
 * @param {Object} transaction
 * @return {String|null} A category id or null if the transaction has not been categorized yet
 */
export const getCategoryId = transaction => {
  const localModelOverride = flag('local-model-override')

  return BankTransaction.getCategoryId(transaction, { localModelOverride })
}

export const getParentCategory = transaction => {
  return getParent(getCategoryId(transaction))
}

export const isAwaitingCategorization = transaction => {
  return getCategoryId(transaction) === null
}

// This function builds a map of categories and sub-categories, each containing
// a list of related transactions, a name and a color
export const transactionsByCategory = transactions => {
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
    if (!categories.hasOwnProperty(parent.name)) {
      categories[parent.name] = makeCategory(parent)
    }
    const category = categories[parent.name]

    // create a new subcategory if necessary
    if (!category.subcategories.hasOwnProperty(catId)) {
      category.subcategories[catId] = makeSubcategory(catId)
    }
    const subcategory = category.subcategories[catId]

    category.transactions.push(transaction)
    subcategory.transactions.push(transaction)
  }

  return categories
}

// Very specific to this component: takes the transactions by category as returned by the
// `transactionsByCategory` function, and turns it into a flat array, while computing derived
// data such as totals and currencies.
// The result is used pretty much as is down the chain by other components, so changing property
// names here should be done with care.
export const computeCategorieData = transactionsByCategory => {
  return Object.values(transactionsByCategory).map(category => {
    let subcategories = Object.values(category.subcategories).map(
      subcategory => {
        const debit = subcategory.transactions.reduce(
          (total, op) => (op.amount < 0 ? total + op.amount : total),
          0
        )
        const credit = subcategory.transactions.reduce(
          (total, op) => (op.amount > 0 ? total + op.amount : total),
          0
        )

        return {
          id: subcategory.id,
          name: subcategory.name,
          amount: credit + debit,
          debit: debit,
          credit: credit,
          percentage: 0,
          currency:
            subcategory.transactions.length > 0
              ? getCurrencySymbol(subcategory.transactions[0].currency)
              : '',
          transactionsNumber: subcategory.transactions.length
        }
      }
    )

    const debit = category.transactions.reduce(
      (total, op) => (op.amount < 0 ? total + op.amount : total),
      0
    )
    const credit = category.transactions.reduce(
      (total, op) => (op.amount > 0 ? total + op.amount : total),
      0
    )

    return {
      id: category.id,
      name: category.name,
      color: category.color,
      amount: credit + debit,
      debit: debit,
      credit: credit,
      percentage: 0,
      currency:
        category.transactions.length > 0
          ? getCurrencySymbol(category.transactions[0].currency)
          : '',
      transactionsNumber: category.transactions.length,
      subcategories: subcategories
    }
  })
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
