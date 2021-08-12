import { Q } from 'cozy-client'

import { TRANSACTION_DOCTYPE } from 'doctypes'

export const searchConn = {
  query: Q(TRANSACTION_DOCTYPE)
    .where({ _id: { $gt: null } })
    .indexFields(['date'])
    .sortBy([{ date: 'desc' }])
    .limitBy(1000),
  as: 'transactions-searchPage'
}
