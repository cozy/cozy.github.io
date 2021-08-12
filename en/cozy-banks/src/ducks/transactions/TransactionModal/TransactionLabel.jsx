import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'

import { getLabel } from 'ducks/transactions'
import SearchForTransactionIcon from 'ducks/transactions/TransactionModal/SearchForTransactionIcon'

const TransactionLabel = ({ transaction }) => {
  const label = getLabel(transaction)

  return (
    <Typography variant="h6" gutterBottom>
      {label}
      {
        <>
          {' '}
          <SearchForTransactionIcon transaction={transaction} />
        </>
      }
    </Typography>
  )
}

export default React.memo(TransactionLabel)
