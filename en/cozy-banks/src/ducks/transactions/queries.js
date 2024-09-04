import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import startOfYear from 'date-fns/start_of_year'
import endOfYear from 'date-fns/end_of_year'
import format from 'date-fns/format'
import merge from 'lodash/merge'

import { Q } from 'cozy-client'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, transactionsConn } from 'doctypes'

import { APPLICATION_DATE } from 'ducks/transactions/constants'

export const makeAccounts = (filteringDoc, groups) => {
  let accounts
  if (filteringDoc.virtual) {
    accounts = filteringDoc.accounts?.raw || []
  } else {
    const group = groups.data.find(g => g._id === filteringDoc._id)
    accounts = group?.accounts?.raw || []
  }
  return accounts
}

/**
 * Outputs a connection to fetch transactions
 * based on the current filtering doc
 *
 * @param  {FilterTransactionsConnOptions} options - Options
 * @return {Connection}
 */
export const makeFilteredTransactionsConn = options => {
  const { filteringDoc, groups, accounts, dateAttribute = 'date' } = options
  let enabled = true
  if (!groups.lastUpdate || !accounts.lastUpdate) {
    enabled = false
  }

  let indexFields = ['account', dateAttribute]
  let whereClause
  let sortByClause = [{ account: 'desc' }, { [dateAttribute]: 'desc' }]

  if (enabled) {
    if (filteringDoc) {
      if (filteringDoc._type === GROUP_DOCTYPE) {
        // The query issued does not use the index "by_account_and_date"
        // because of the $or. It is therefore much slower than queries
        // with only the account. We haven't found a satisfactory solution
        // yet.
        const accounts = makeAccounts(filteringDoc, groups)
        indexFields = [dateAttribute, 'account']
        whereClause = {
          account: { $in: accounts }
        }
        sortByClause = [{ [dateAttribute]: 'desc' }, { account: 'desc' }]
      } else if (filteringDoc._type === ACCOUNT_DOCTYPE) {
        whereClause = { account: filteringDoc._id }
      } else if (Array.isArray(filteringDoc)) {
        whereClause = {
          account: { $in: filteringDoc }
        }
      } else {
        throw new Error('Unsupported filtering doc to create transaction query')
      }
    } else {
      indexFields = [dateAttribute]
      whereClause = {
        _id: {
          $gt: null
        }
      }
      sortByClause = [{ [dateAttribute]: 'desc' }]
    }
  }

  return {
    query: () =>
      transactionsConn
        .query()
        .where(whereClause)
        .indexFields(indexFields)
        .sortBy(sortByClause)
        .limitBy(100),
    fetchPolicy: transactionsConn.fetchPolicy,
    as: `transactions-by-${dateAttribute}-${
      filteringDoc ? filteringDoc._id : 'all'
    }`,
    enabled: enabled
  }
}

/**
 * Makes queries to load earliest and latest transactions from
 * a base query.
 * The base query can contain a selector on the account for example
 * and it will be kept in the returned queries.
 * The date selector on the base query will be reset though so that
 * the queries return the earliest / latest transactions.
 *
 * @param  {QueryDefinition} baseQuery - The base query for transactions
 * @return {[QueryDefinition, QueryDefinition]} - Earliest and latest queries
 */
export const makeEarliestLatestQueries = baseQuery => {
  /**
   * Big hack. We worked to optimize this query see
   * commit 2bb11660ec40c683898673b3270c763404552cd8
   *
   * But by doing so, we had an issue where when selecting
   * "all accounts", the result was not right. This is because
   * we indexed by _id first and then date.
   * So the current fix is :
   * - If we have a selector on an account AND this selector doesn't
   * containt any special operator (aka starting by $)
   * (see https://forum.cozy.io/t/impossible-de-remonter-jusquau-bout-de-lhistorique-doperations-dans-analyse-apres-import-ach/7547),
   * then the index should be indexed by account first and then we ensure
   * that we have the date within the index
   *
   * - If we don't have a slector on an account, then the index
   * should be indexed first by the date and then by the account
   *
   * @todo: We should really split all this query creation to several
   * methods. We can't have optimized query with such generic methods
   */

  const selectors = Object.keys(baseQuery.selector)
  let indexedFields
  if (
    selectors.includes('account') &&
    !Object.values(baseQuery.selector).some(a =>
      Object.keys(a)[0].startsWith('$')
    )
  ) {
    indexedFields = selectors
    indexedFields.push('date')
  } else {
    indexedFields = ['date']
    indexedFields.push(...selectors)
  }

  const sortByDesc = []
  const sortByAsc = []
  indexedFields.map(field => {
    sortByDesc.push({ [field]: 'desc' })
    sortByAsc.push({ [field]: 'asc' })
  })
  const latestQuery = Q('io.cozy.bank.operations')
    .limitBy(1)
    .where({ ...baseQuery.selector, date: { $gt: null } }) // must reset the date
    .indexFields(indexedFields)
    .sortBy(sortByDesc)
  const earliestQuery = Q('io.cozy.bank.operations')
    .limitBy(1)
    .where({ ...baseQuery.selector, date: { $gt: null } }) // must reset the date
    .indexFields(indexedFields)
    .sortBy(sortByAsc)
  return [earliestQuery, latestQuery]
}

/**
 * Add a month selector to a connection, month is only a upper limit
 * to allow for infinite scrolling through fetchMore
 */
export const addMonthToConn = (baseConn, month) => {
  const { query: baseQuery, as: baseAs, ...rest } = baseConn
  const thresholdDate = endOfMonth(new Date(month)).toISOString()
  const q = baseQuery()
  const query = q.where({ date: { $lt: thresholdDate }, ...q.selector })
  const as = `${baseAs}-${month}`
  return {
    query,
    as,
    ...rest
  }
}

/**
 * Makes a new conn, adding a date filter on the query selector
 * so that only transactions for a given month are fetched.
 */
export const addPeriodToConn = ({
  baseConn,
  period,
  dateAttribute = 'date'
}) => {
  const { query: mkBaseQuery, as: baseAs, ...rest } = baseConn
  const d = new Date(period)
  const startDate = period.length === 7 ? startOfMonth(d) : startOfYear(d)
  const endDate = period.length === 7 ? endOfMonth(d) : endOfYear(d)
  const dateFormat =
    dateAttribute === APPLICATION_DATE ? 'YYYY-MM-DD' : 'YYYY-MM-DD[T]HH:mm'
  const baseQuery = mkBaseQuery()

  const query = Q(baseQuery.doctype)
    .where(
      merge(
        {
          [dateAttribute]: {
            $lte: format(endDate, dateFormat),
            $gte: format(startDate, dateFormat)
          }
        },
        baseQuery.selector
      )
    )
    .indexFields(baseQuery.indexedFields || ['account', dateAttribute])
    .sortBy(
      baseQuery.sort || [{ account: 'desc' }, { [dateAttribute]: 'desc' }]
    )
    .limitBy(500)
  const as = `${baseAs}-by-${dateAttribute}-${format(
    startDate,
    'YYYY-MM'
  )}-${format(endDate, 'YYYY-MM')}`
  return {
    query,
    as,
    ...rest
  }
}
