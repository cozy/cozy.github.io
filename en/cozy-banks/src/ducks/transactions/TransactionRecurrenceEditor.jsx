import React, { useMemo } from 'react'
import { useClient, useQuery } from 'cozy-client'
import { NestedSelect, useI18n } from 'cozy-ui/transpiled/react'
import { prettyLabel } from 'ducks/recurrence/utils'
import { recurrenceConn } from 'doctypes'
import { updateTransactionRecurrence } from 'ducks/transactions/helpers'
import CategoryIcon from 'ducks/categories/CategoryIcon'

const optionFromRecurrence = rec => {
  return {
    _id: rec._id,
    title: prettyLabel(rec.label),
    icon: <CategoryIcon categoryId={rec.categoryId} />
  }
}

const isSelectedHelper = (item, currentId) => {
  if (item.id === 'not-recurrent' && !currentId) {
    return true
  }
  if (item.id === 'recurrent' && currentId) {
    return true
  }
  if (item._id === currentId) {
    return true
  }
  return false
}

const TransactionRecurrenceEditor = ({
  transaction,
  beforeUpdate,
  afterUpdate
}) => {
  const { t } = useI18n()
  const client = useClient()

  const current = transaction.recurrence.data
  const currentId = current && current._id
  const { data: allRecurrences } = useQuery(
    recurrenceConn.query,
    recurrenceConn
  )

  const recurrenceOptions = useMemo(
    () => allRecurrences.map(optionFromRecurrence),
    [allRecurrences]
  )

  const handleSelect = async category => {
    if (beforeUpdate) {
      await beforeUpdate()
    }
    const newTransaction = await updateTransactionRecurrence(
      client,
      transaction,
      category
    )
    if (afterUpdate) {
      await afterUpdate(newTransaction)
    }
  }

  const isSelected = item => isSelectedHelper(item, currentId)

  return (
    <NestedSelect
      radioPosition="left"
      isSelected={isSelected}
      onSelect={handleSelect}
      options={{
        children: [
          {
            id: 'not-recurrent',
            title: t('Recurrence.choice.not-recurrent')
          },
          {
            id: 'recurrent',
            title: t('Recurrence.choice.recurrent'),
            description: current && prettyLabel(current.label),
            children: recurrenceOptions
          }
        ]
      }}
    />
  )
}

export default TransactionRecurrenceEditor
