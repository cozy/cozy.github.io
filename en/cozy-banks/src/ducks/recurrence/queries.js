import CozyClient, { Q } from 'cozy-client'
import { TRANSACTION_DOCTYPE } from 'doctypes'

const older30s = CozyClient.fetchPolicies.olderThan(30 * 1000)

export const queryRecurrenceTransactions = recurrence =>
  Q(TRANSACTION_DOCTYPE).where({
    'relationships.recurrence.data._id': recurrence._id
  })

export const queryRecurrencesTransactions = recurrences =>
  Q(TRANSACTION_DOCTYPE).where({
    'relationships.recurrence.data._id': {
      $in: recurrences.map(x => x._id)
    }
  })

export const bundleTransactionsQueryConn = ({ bundle }) => {
  return {
    query: () => {
      const initialQDef = queryRecurrenceTransactions(bundle)
      const qDef = initialQDef
        .indexFields(['relationships.recurrence.data._id', 'date'])
        .sortBy([
          { 'relationships.recurrence.data._id': 'desc' },
          { date: 'desc' }
        ])
        .where({ ...initialQDef.selector, date: { $gt: null } })
        .UNSAFE_noLimit()
        .include(['bills', 'account', 'reimbursements', 'recurrence'])
      return qDef
    },
    as: `bundle-transactions-${bundle._id}`,
    fetchPolicy: older30s
  }
}
