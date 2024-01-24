import React, { useMemo } from 'react'

import { DESKTOP_SCROLLING_ELEMENT_CLASSNAME } from 'ducks/transactions/scroll/getScrollingElement'
import { TransactionList } from 'ducks/transactions/Transactions'
import getCategoryId from 'ducks/transactions/getCategoryId'
import { getCategoryIdFromName } from 'ducks/categories/helpers'

const CategoryTransactions = ({ transactions, subcategoryName }) => {
  const categoryTransactions = useMemo(() => {
    const categoryId = getCategoryIdFromName(subcategoryName)
    return transactions
      ? transactions.filter(t => {
          const tc = getCategoryId(t)
          return tc === categoryId
        })
      : []
  }, [subcategoryName, transactions])

  return (
    <div className={DESKTOP_SCROLLING_ELEMENT_CLASSNAME}>
      <TransactionList
        showTriggerErrors={false}
        onChangeTopMostTransaction={null}
        onScroll={null}
        transactions={categoryTransactions}
        canFetchMore={false}
        filteringOnAccount={true}
        onReachBottom={null}
      />
    </div>
  )
}

export default React.memo(CategoryTransactions)
