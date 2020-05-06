import CozyClient, { Q } from 'cozy-client'
import { TRANSACTION_DOCTYPE } from 'doctypes'

const older30s = CozyClient.fetchPolicies.olderThan(30 * 1000)

export const queryRecurrenceTransactions = recurrence =>
  Q(TRANSACTION_DOCTYPE).where({
    'relationships.recurrence.data._id': recurrence._id
  })

export const bundleTransactionsQueryConn = ({ bundle }) => {
  return {
    query: () =>
      queryRecurrenceTransactions(bundle)
        .sortBy([{ date: 'desc' }])
        .UNSAFE_noLimit()
        .include(['bills', 'account', 'reimbursements', 'recurrence']),
    as: `bundle-transactions-${bundle._id}`,
    fetchPolicy: older30s
  }
}
