import React, { useMemo } from 'react'
import { useClient, useQuery } from 'cozy-client'
import { NestedSelect, useI18n, Icon } from 'cozy-ui/transpiled/react'
import { getLabel, makeRecurrenceFromTransaction } from 'ducks/recurrence/utils'
import { NOT_RECURRENT_ID } from 'ducks/recurrence/api'
import { recurrenceConn } from 'doctypes'
import { updateTransactionRecurrence } from 'ducks/transactions/helpers'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import { RECURRENCE_DOCTYPE } from 'doctypes'
import styles from './TransactionRecurrenceEditor.styl'

const makeOptionFromRecurrence = rec => {
  return {
    _id: rec._id,
    _type: RECURRENCE_DOCTYPE,
    title: getLabel(rec),
    icon: <CategoryIcon categoryId={rec.categoryId} />
  }
}

const NewRecurrenceIcon = () => {
  return <Icon icon="plus" className={styles.NewRecurrenceIcon} />
}

const makeNewRecurrenceOption = t => {
  return {
    _id: NEW_RECURRENCE_ID,
    _type: RECURRENCE_DOCTYPE,
    title: t('Recurrence.choice.new-recurrence'),
    icon: <NewRecurrenceIcon />
  }
}

const isSelectedHelper = (item, currentId) => {
  if (item._id === 'not-recurrent' && !currentId) {
    return true
  }
  if (item._id === 'recurrent' && currentId) {
    return true
  }
  if (item._id === currentId) {
    return true
  }
  return false
}

const RECURRENT_ID = 'recurrent'
const NEW_RECURRENCE_ID = 'new-recurrence'

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
    () =>
      allRecurrences
        ? [makeNewRecurrenceOption(t)].concat(
            allRecurrences.map(makeOptionFromRecurrence)
          )
        : null,
    [allRecurrences, t]
  )

  const handleSelect = async recurrenceChoice => {
    if (beforeUpdate) {
      await beforeUpdate()
    }

    if (recurrenceChoice._id === NEW_RECURRENCE_ID) {
      const { data: recurrence } = await client.save(
        makeRecurrenceFromTransaction(transaction)
      )

      recurrenceChoice = {
        _id: recurrence._id,
        _type: RECURRENCE_DOCTYPE
      }
    }

    const newTransaction = await updateTransactionRecurrence(
      client,
      transaction,
      recurrenceChoice
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
            _id: NOT_RECURRENT_ID,
            _type: RECURRENCE_DOCTYPE,
            title: t('Recurrence.choice.not-recurrent')
          },
          {
            _id: RECURRENT_ID,
            title: t('Recurrence.choice.recurrent'),
            description: current && getLabel(current),
            children: recurrenceOptions
          }
        ]
      }}
    />
  )
}

export default TransactionRecurrenceEditor
