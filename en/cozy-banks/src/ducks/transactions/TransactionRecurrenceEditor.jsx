import min from 'lodash/min'
import max from 'lodash/max'
import sortBy from 'lodash/sortBy'
import keyBy from 'lodash/keyBy'
import React, { useMemo } from 'react'
import {
  useClient,
  useQuery,
  isQueryLoading,
  hasQueryBeenLoaded,
  dehydrate
} from 'cozy-client'
import NestedSelect from 'cozy-ui/transpiled/react/NestedSelect'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

import { accountsConn, recurrenceConn, RECURRENCE_DOCTYPE } from 'doctypes'
import {
  getLabel,
  makeRecurrenceFromTransaction,
  getCategories,
  getFrequencyText
} from 'ducks/recurrence/utils'
import { NOT_RECURRENT_ID } from 'ducks/recurrence/constants'
import { updateTransactionRecurrence } from 'ducks/transactions/helpers'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import styles from './TransactionRecurrenceEditor.styl'
import Loading from 'components/Loading'
import { DEFAULT_CURRENCY_SYMBOL } from 'utils/currencySymbol'

const RECURRENT_ID = 'recurrent'
const NEW_RECURRENCE_ID = 'new-recurrence'

// TODO Add currency into recurrences object
const formatRecurrenceAmount = (amount, recurrence) => {
  if (recurrence.currency) {
    return `${Math.abs(amount)}${recurrence.currency}`
  } else {
    return `${Math.abs(amount)}${DEFAULT_CURRENCY_SYMBOL}`
  }
}

export const makeOptionFromRecurrence = (rec, t, accountsById) => {
  const minAmount = min(rec.amounts)
  const maxAmount = max(rec.amounts)

  const freqDescription = getFrequencyText(t, rec)
  const amountDescription =
    minAmount === maxAmount
      ? t('Recurrence.description-amount', {
          amount: formatRecurrenceAmount(minAmount, rec)
        })
      : t('Recurrence.description-amounts', {
          minAmount: formatRecurrenceAmount(minAmount, rec),
          maxAmount: formatRecurrenceAmount(maxAmount, rec)
        })
  const accountDescription = rec.accounts
    ? rec.accounts
        .map(accountId => {
          const account = accountsById[accountId]
          return account ? account.label : null
        })
        .filter(Boolean)
        .join(' · ')
    : null
  return {
    _id: rec._id,
    _type: RECURRENCE_DOCTYPE,
    key: rec._id,
    title: getLabel(rec),
    icon: <CategoryIcon categoryId={getCategories(rec)[0]} />,
    description: [freqDescription, amountDescription, accountDescription]
      .filter(Boolean)
      .join(' · ')
  }
}

const NewRecurrenceIcon = () => {
  return <Icon icon={PlusIcon} className={styles.FakeCategoryIcon} />
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
  if (item._id === NOT_RECURRENT_ID && !currentId) {
    return true
  }
  if (item._id === RECURRENT_ID && currentId) {
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
  const recurrenceCol = useQuery(recurrenceConn.query, recurrenceConn)

  const { data: accounts } = useQuery(accountsConn.query, accountsConn)
  const accountsById = useMemo(() => keyBy(accounts, x => x._id), [accounts])
  const { data: allRecurrences } = recurrenceCol

  const recurrenceOptions = useMemo(
    () =>
      allRecurrences
        ? [makeNewRecurrenceOption(t)].concat(
            sortBy(allRecurrences, getLabel).map(recurrence =>
              makeOptionFromRecurrence(recurrence, t, accountsById)
            )
          )
        : null,
    [accountsById, allRecurrences, t]
  )

  const handleSelect = async originalRecurrenceChoice => {
    let recurrenceChoice = originalRecurrenceChoice
    if (beforeUpdate) {
      await beforeUpdate()
    }

    if (recurrenceChoice._id === NEW_RECURRENCE_ID) {
      const { data: recurrence } = await client.save(
        makeRecurrenceFromTransaction(dehydrate(transaction))
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

  if (isQueryLoading(recurrenceCol) && !hasQueryBeenLoaded(recurrenceCol)) {
    return <Loading spinnerSize="xlarge" />
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
            description: current && (
              <div className="u-ellipsis">{getLabel(current)}</div>
            ),
            children: recurrenceOptions
          }
        ]
      }}
    />
  )
}

export default TransactionRecurrenceEditor
