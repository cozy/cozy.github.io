import React from 'react'
import cx from 'classnames'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { Table } from 'components/Table'

import transactionsStyles from 'ducks/transactions/Transactions.styl'

const TableHead = ({ isSubcategory }) => {
  const { t } = useI18n()
  const { isDesktop } = useBreakpoints()

  if (!isDesktop) {
    return null
  }

  return (
    <Table>
      <thead>
        <tr>
          <td className={cx(transactionsStyles.ColumnSizeCheckbox, 'u-pl-0')} />
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
