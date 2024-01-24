import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { getDate } from 'ducks/transactions/helpers'

const TransactionDate = ({ isExtraLarge, transaction }) => {
  const { t, f } = useI18n()

  return (
    <span
      title={
        transaction.realisationDate &&
        transaction.date !== transaction.realisationDate
          ? t('Transactions.will-be-debited-on', {
              date: f(transaction.date, 'D MMMM YYYY')
            })
          : null
      }
    >
      {f(getDate(transaction), `D ${isExtraLarge ? 'MMMM' : 'MMM'} YYYY`)}
    </span>
  )
}

export default React.memo(TransactionDate)
