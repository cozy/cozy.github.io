import React from 'react'
import { withClient } from 'cozy-client'
import DateMonthPicker from 'cozy-ui/transpiled/react/DateMonthPicker'
import {
  getDate,
  getApplicationDate,
  updateApplicationDate
} from 'ducks/transactions/helpers'

const TransactionApplicationDateEditor = withClient(props => {
  const { client, transaction, beforeUpdate, afterUpdate } = props

  const handleSelect = async monthDate => {
    await beforeUpdate(props)
    const newTransaction = await updateApplicationDate(
      client,
      transaction,
      monthDate
    )
    await afterUpdate(newTransaction)
  }

  const date = getDate(transaction)
  const applicationDate = getApplicationDate(transaction)

  return (
    <div className="u-p-half">
      <DateMonthPicker
        initialValue={(applicationDate || date).slice(0, 10)}
        onSelect={handleSelect}
      />
    </div>
  )
})

export default TransactionApplicationDateEditor
