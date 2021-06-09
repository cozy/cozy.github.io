import { getFilteredTransactions } from 'ducks/filters'
import { createSelector } from 'reselect'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { getTransactionsByCategory as getTransactionsByCategoryRaw } from './helpers'

// Takes the transactions by category and turns it into a flat array,
// while computing derived data such as totals and currencies.
// The result is used pretty much as is down the chain by other components,
// so changing property names here should be done with care.
export const computeCategoriesData = transactions => {
  const transactionsByCategory = getTransactionsByCategoryRaw(transactions)
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

export const getCategoriesData = createSelector(
  [getFilteredTransactions],
  computeCategoriesData
)
