import React from 'react'

import TagChip from 'components/Tag/TagChip'
import { getTransactionTags } from 'ducks/transactions/helpers'

const TagChips = ({
  className,
  transaction,
  clickable,
  deletable,
  withIcon
}) => {
  const transactionTags = getTransactionTags(transaction)

  return (
    <>
      {transactionTags?.map(transactionTag => (
        <TagChip
          className={className}
          key={transactionTag._id}
          transaction={transaction}
          tag={transactionTag}
          clickable={clickable}
          deletable={deletable}
          withIcon={withIcon}
        />
      ))}
    </>
  )
}

export default TagChips
