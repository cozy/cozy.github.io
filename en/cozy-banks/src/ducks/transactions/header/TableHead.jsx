import React from 'react'
import { Table } from 'components/Table'

import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import transactionsStyles from 'ducks/transactions/Transactions.styl'

const TableHead = props => {
  const { t } = useI18n()
  const { isDesktop } = useBreakpoints()
  const { isSubcategory } = props

  if (!isDesktop) {
    return null
  }

  return (
    <Table>
      <thead>
        <tr>
          <td className={transactionsStyles.ColumnSizeDesc}>
            {isSubcategory
              ? t('Categories.headers.movements')
              : t('Transactions.header.description')}
          </td>
          <td className={transactionsStyles.ColumnSizeDate}>
            {t('Transactions.header.date')}
          </td>
          <td className={transactionsStyles.ColumnSizeAmount}>
            {t('Transactions.header.amount')}
          </td>
          <td className={transactionsStyles.ColumnSizeAction}>
            {t('Transactions.header.action')}
          </td>
        </tr>
      </thead>
    </Table>
  )
}

TableHead.defaultProps = {
  isSubcategory: false
}

export default TableHead
