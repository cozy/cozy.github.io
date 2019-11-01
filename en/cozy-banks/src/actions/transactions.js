/**
  Bank transactions related features
**/
// import { flatten, uniq } from 'lodash'
// import { parse, format, addMonths } from 'date-fns'
// import { TRANSACTION_DOCTYPE, BILL_DOCTYPE } from 'doctypes'
// import { isHealthExpense } from 'ducks/categories/helpers'
// import assert from 'utils/assert'
// import {
//   getFilteredAccountIds,
//   getPeriod,
//   addFilterForMostRecentTransactions
// } from 'ducks/filters'

// const COLLECTION_NAME = 'transactions'

// const getBillIds = transaction => {
//   return transaction.reimbursements
//     ? transaction.reimbursements
//         .filter(reimbursement => reimbursement.billId)
//         .map(reimbursement => reimbursement.billId.split(':')[1])
//     : 0
// }

// const fetchBillsForHealthExpenses = (client, transactions) => {
//   const docIds = uniq(
//     flatten(
//       transactions
//         .filter(isHealthExpense)
//         .filter(t => t.reimbursements)
//         .map(getBillIds)
//     )
//   )

//   docIds.forEach(id => client.get(BILL_DOCTYPE, id))

//   return transactions
// }

// const parseTransactions = (client, res) => {
//   const transactions = res.data

//   fetchBillsForHealthExpenses(client, transactions)
//   return res
// }

// const defer = cb => {
//   setTimeout(cb)
// }

// let firstFetch = true
// export const fetchTransactions = (exports.fetchTransactions = (
//   options = {},
//   onFetch
// ) => (dispatch, getState) => {
//   const state = getState()
//   const collection = getCollection(state, COLLECTION_NAME)
//   if (
//     collection &&
//     collection.fetchStatus === 'loaded' &&
//     collection.hasMore === false
//   ) {
//     return
//   }
//   const action = fetchCollection(COLLECTION_NAME, TRANSACTION_DOCTYPE, {
//     sort: { date: 'desc' },
//     descending: true,
//     limit: 100,
//     fields: [
//       'date',
//       'manualCategoryId',
//       'automaticCategoryId',
//       'currency',
//       'amount',
//       'label',
//       'bills',
//       'account'
//     ],
//     ...options
//   })
//   const originalPromise = action.promise
//   action.promise = (client, dispatch) => {
//     return originalPromise(client)
//       .then(res => parseTransactions(dispatch, res))
//       .then(res => {
//         if (onFetch) {
//           onFetch(dispatch, res)
//         }
//         if (firstFetch) {
//           firstFetch = false

//           // We must defer the filter after transactions
//           // have been correctly stored
//           defer(() => {
//             dispatch(addFilterForMostRecentTransactions())
//           })
//         }
//         return res
//       })
//   }

//   return dispatch(action)
// })

// const monthFormat = 'YYYY-MM'
// const parseMonth = s => parse(s, monthFormat)
// const formatMonth = s => format(s, monthFormat)
// const monthRx = /\d{4}-\d{2}/
// /* Fetch transactions for current account(s) and period */
// export const fetchTransactionsWithState = (exports.fetchTransactionsWithState = onFetch => (
//   dispatch,
//   getState
// ) => {
//   const state = getState()
//   const accountIds = getFilteredAccountIds(state)
//   const period = getPeriod(state)
//   const month = period && period.length === 8 && period
//   assert(
//     !month || (month && monthRx.exec(month)),
//     'month must be in the form YYYY-MM'
//   )
//   const nextMonth = formatMonth(addMonths(parseMonth(month), 1))
//   const selector = {}
//   // This should be toggled when cozy-client supports
//   // merging of collection
//   // https://github.com/cozy/cozy-drive/pull/800
//   //
//   if (month) {
//     selector.date = {
//       $gt: month,
//       $lt: nextMonth
//     }
//   }
//   if (accountIds && accountIds.length) {
//     selector.account = {
//       $in: accountIds
//     }
//   }

//   return dispatch(
//     exports.fetchTransactions(
//       {
//         selector: Object.keys(selector).length > 0 ? selector : null
//       },
//       onFetch
//     )
//   )
// })
