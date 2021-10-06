import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'

import { getLabel } from 'ducks/transactions'
import SearchForTransactionIcon from 'ducks/transactions/TransactionModal/SearchForTransactionIcon'

const TransactionLabel = ({ transaction }) => {
  const label = getLabel(transaction)

  return (
    <div className="u-flex">
      <Typography
        variant="h6"
        gutterBottom
        className="u-ellipsis"
        title={label}
      >
        {label}
      </Typography>
      {
        <>
          {' '}
          <SearchForTransactionIcon transaction={transaction} />
        </>
      }
    </div>
  )
}

export default React.memo(TransactionLabel)
