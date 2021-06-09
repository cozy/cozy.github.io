/**
 * @typedef {object} Connection
 * @property {string} as - Name of the query
 * @property {function(Client):QueryDefinition} query - Function creating a query
 * @property {function(QueryState):Boolean} fetchPolicy - Fetch policy for the query
 * @property {Boolean} enabled - Whether the query is enabled
 */

/**
 * @typedef {object} BankTransaction
 * @property {string} _id
 * @property {string} label
 * @property {string?} automaticCategoryId
 * @property {string?} cozyCategoryId
 * @property {string?} manualCategoryId
 */

/**
 * @typedef {object} CategorySummary
 * @property {Array<BankTransaction>} transactions
 * @property {Record<CategoryId,{ transactions: Array<BankTransaction> }>} subcategories
 */

/**
 * @typedef {Record<CategoryName, CategorySummary>} TransactionCategoriesSummary
 */
