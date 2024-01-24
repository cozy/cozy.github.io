import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'

import { getDate, getApplicationDate } from 'ducks/transactions/helpers'

export const showAlertAfterApplicationDateUpdate = (transaction, t, f) => {
  const date = getApplicationDate(transaction) || getDate(transaction)
  Alerter.success(
    t('Transactions.infos.applicationDateChangedAlert', {
      applicationDate: f(date, 'MMMM')
    })
  )
}

export const stopPropagation = ev => ev.stopPropagation()
