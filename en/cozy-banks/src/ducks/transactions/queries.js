import { Q } from 'cozy-client'
import { GROUP_DOCTYPE, ACCOUNT_DOCTYPE, transactionsConn } from 'doctypes'
import startOfMonth from 'date-fns/start_of_month'
import endOfMonth from 'date-fns/end_of_month'
import startOfYear from 'date-fns/start_of_year'
import endOfYear from 'date-fns/end_of_year'
import format from 'date-fns/format'
import merge from 'lodash/merge'

/**
 * Outputs a connection to fetch transactions
 * based on the current filtering doc
 *
 * @param  {FilterTransactionsConnOptions} options - Options
 * @return {Connection}
 */
export const makeFilteredTransactionsConn = options => {
  const { filteringDoc, groups, accounts } = options
  let enabled = true
  if (!groups.lastUpdate || !accounts.lastUpdate) {
    enabled = false
  }

  let indexFields
  let whereClause
  let sortByClause = []

  if (enabled) {
    if (filteringDoc) {
      if (filteringDoc._type === GROUP_DOCTYPE) {
        // The query issued does not use the index "by_account_and_date"
        // because of the $or. It is therefore much slower than queries
        // with only the account. We haven't found a satisfactory solution
        // yet.
        let accounts
        if (filteringDoc.virtual) {
          accounts = filteringDoc.accounts.raw || []
        } else {
          const group = groups.data.find(g => g._id === filteringDoc._id)
          accounts = group ? group.accounts.raw : []
        }
        indexFields = ['date', 'account']
        whereClause = {
          account: { $in: accounts }
        }
        sortByClause = [{ date: 'desc' }, { account: 'desc' }]
      } else if (filteringDoc._type === ACCOUNT_DOCTYPE) {
        indexFields = ['date', 'account']
        whereClause = { account: filteringDoc._id }
        sortByClause = [{ date: 'desc' }, { account: 'desc' }]
      } else if (Array.isArray(filteringDoc)) {
        indexFields = ['date', 'account']
        whereClause = {
          account: { $in: filteringDoc }
        }
        sortByClause = [{ date: 'desc' }, { account: 'desc' }]
      } else {
        throw new Error('Unsupported filtering doc to create transaction query')
      }
    } else {
      indexFields = ['date', '_id']
      whereClause = {
        _id: {
          $gt: null
        }
      }
      sortByClause = [{ date: 'desc' }]
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
    as: `transactions-${filteringDoc ? filteringDoc._id : 'all'}`,
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
  const latestQuery = Q('io.cozy.bank.operations')
    .limitBy(1)
    .where({ ...baseQuery.selector, date: { $gt: null } }) // must reset the date
    .indexFields(['date'])
    .sortBy([{ date: 'desc' }])
  const earliestQuery = Q('io.cozy.bank.operations')
    .limitBy(1)
    .where({ ...baseQuery.selector, date: { $gt: null } }) // must reset the date
    .indexFields(['date'])
    .sortBy([{ date: 'asc' }])
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
export const addPeriodToConn = (baseConn, period) => {
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
            $lte: format(endDate, 'YYYY-MM-DD[T]HH:mm'),
            $gte: format(startDate, 'YYYY-MM-DD[T]HH:mm')
          }
        },
        baseQuery.selector
      )
    )
    .indexFields(baseQuery.indexedFields || ['date', 'account'])
    .sortBy(baseQuery.sort || [{ date: 'desc' }, { account: 'desc' }])
    .limitBy(500)
  const as = `${baseAs}-${format(startDate, 'YYYY-MM')}-${format(
    endDate,
    'YYYY-MM'
  )}`
  return {
    query,
    as,
    ...rest
  }
}
