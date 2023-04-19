import { parse } from '@fast-csv/parse'
import compact from 'lodash/compact'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'
import uniq from 'lodash/uniq'
import { BankAccount, BankTransaction } from 'cozy-doctypes'

import {
  ACCOUNT_DOCTYPE,
  RECURRENCE_DOCTYPE,
  TAGS_DOCTYPE,
  TRANSACTION_DOCTYPE
} from 'doctypes'
import { NOT_RECURRENT_ID } from 'ducks/recurrence/constants'
import { getCategoryIdFromName } from 'ducks/categories/categoriesMap'
import { getLabel as getTransactionLabel } from 'ducks/transactions/helpers'
import {
  addRelationship,
  fullDateStr,
  reconciliate,
  withExistingDocIds,
  withMetadata
} from './helpers'
import { saveAll } from './queries'

/* ------ CSV Parsing ------ */

const accountId = ({ institutionLabel, number, label, type }) =>
  number || `${institutionLabel}/${label}/${type}`

const buildAccount = (
  accountsById,
  {
    accountBalance,
    accountComingBalance,
    accountCustomName,
    accountIban,
    accountName,
    accountNumber,
    accountOriginalNumber,
    accountType,
    accountVendorDeleted,
    currency,
    institutionLabel,
    vendorAccountId
  }
) => {
  const number = BankAccount.normalizeAccountNumber(accountNumber, accountIban)

  const id = accountId({
    institutionLabel,
    number,
    label: accountName,
    type: accountType
  })

  if (accountsById[id] == null) {
    accountsById[id] = {
      _type: ACCOUNT_DOCTYPE,
      institutionLabel,
      label: accountName,
      shortLabel: accountCustomName,
      number,
      originalNumber: accountOriginalNumber,
      type: accountType,
      currency,
      balance: Number(accountBalance),
      comingBalance: Number(accountComingBalance),
      iban: accountIban,
      vendorDeleted: accountVendorDeleted,
      vendorId: vendorAccountId
    }
  }

  return accountsById[id]
}

const recurrenceId = ({ automaticLabel, manualLabel }) =>
  manualLabel || automaticLabel

const buildReccurence = (
  recurrencesById,
  {
    amount,
    categoryName,
    date,
    label,
    recurrent,
    recurrenceName,
    recurrenceFrequency,
    recurrenceStatus
  },
  { account }
) => {
  if (recurrent === 'yes') {
    const associatedAccountId = accountId(account)
    const automaticLabel = getTransactionLabel({ label })
    const manualLabel = recurrenceName
    const id = recurrenceId({ automaticLabel, manualLabel })

    if (recurrencesById[id] == null) {
      recurrencesById[id] = {
        _type: RECURRENCE_DOCTYPE,
        status: recurrenceStatus,
        categoryIds: [getCategoryIdFromName(categoryName)],
        accounts: [], // XXX: Will be populated after accounts have been saved
        amounts: [amount],
        automaticLabel: automaticLabel,
        manualLabel: automaticLabel !== manualLabel ? manualLabel : undefined,
        latestDate: fullDateStr(date),
        latestAmount: amount,
        stats: {
          deltas: { median: Number(recurrenceFrequency) || 0 }
        },
        accountIds: [associatedAccountId]
      }
    } else {
      const recurrence = recurrencesById[id]

      recurrence.categoryIds = uniq(
        recurrence.categoryIds.concat(getCategoryIdFromName(categoryName))
      )
      recurrence.amounts = uniq(recurrence.amounts.concat(amount))
      recurrence.accountIds = uniq(
        recurrence.accountIds.concat(associatedAccountId)
      )

      const { latestDate } = recurrence
      const dateStr = fullDateStr(date)

      if (latestDate < dateStr) {
        recurrence.latestAmount = amount
        recurrence.latestDate = dateStr
      }
    }

    return recurrencesById[id]
  } else if (recurrent === 'no') {
    return {
      _id: NOT_RECURRENT_ID,
      _type: RECURRENCE_DOCTYPE
    }
  }

  return
}

const tagId = tag => tag.label

const buildTags = (tagsById, tagList) => {
  return tagList.map(label => {
    const id = tagId({ label })

    if (tagsById[id] == null) {
      tagsById[id] = {
        _type: TAGS_DOCTYPE,
        label
      }
    }

    return tagsById[id]
  })
}

const transactionId = ({ linxoId, vendorId }) => vendorId || linxoId

const buildTransaction = (
  transactionsById,
  data,
  { account, recurrence, tags }
) => {
  const {
    amount,
    applicationDate,
    categoryName,
    currency,
    date,
    isComing,
    label,
    originalBankLabel,
    realisationDate,
    reimbursementStatus,
    type,
    valueDate,
    vendorTransactionId,
    vendorAccountId
  } = data

  const id = transactionId({ vendorId: vendorTransactionId })

  if (transactionsById[id] == null) {
    const categoryId = getCategoryIdFromName(categoryName)
    transactionsById[id] = {
      _type: TRANSACTION_DOCTYPE,
      date: fullDateStr(date),
      realisationDate: fullDateStr(realisationDate),
      applicationDate: fullDateStr(applicationDate),
      valueDate: fullDateStr(valueDate),
      isComing: isComing === 'yes',
      label,
      originalBankLabel,
      cozyCategoryId: categoryId,
      automaticCategoryId: categoryId,
      amount: Number(amount),
      currency,
      type,
      reimbursementStatus,
      accountId: account ? accountId(account) : '',
      recurrenceId: recurrence ? recurrenceId(recurrence) : '',
      tagIds: tags ? tags.map(tag => tagId(tag)) : [],
      vendorId: vendorTransactionId,
      vendorAccountId
    }
  }

  return transactionsById[id]
}

const transformCSV =
  ({ transactionsById, accountsById, recurrencesById, tagsById }) =>
  data => {
    // Filter lines containing only account information
    if (data.label == '') {
      return
    }

    const { tag1, tag2, tag3, tag4, tag5 } = data
    const tagList = [tag1, tag2, tag3, tag4, tag5].filter(Boolean)

    const account = buildAccount(accountsById, data)
    const recurrence = buildReccurence(recurrencesById, data, { account })
    const tags = buildTags(tagsById, tagList)
    buildTransaction(transactionsById, data, { account, recurrence, tags })
  }

export const createParseStream = ({
  transactionsById,
  accountsById,
  recurrencesById,
  tagsById
}) => {
  return parse({
    delimiter: ';',
    trim: true,
    ignoreEmpty: true,
    discardUnmappedColumns: true,
    renameHeaders: true,
    headers: [
      'date', // 'Date'
      'realisationDate', // 'Realisation date'
      'applicationDate', // 'Assigned date'
      'label', // 'Label'
      'originalBankLabel', // 'Original bank label'
      'categoryName', // 'Category name'
      'amount', // 'Amount'
      'currency', // 'Currency'
      'type', // 'Type'
      'isComing', // 'Expected?'
      'valueDate', // 'Expected debit date'
      'reimbursementStatus', // 'Reimbursement status'
      'institutionLabel', // 'Bank name'
      'accountName', // 'Account name'
      'accountCustomName', // 'Custom account name'
      'accountNumber', // 'Account number'
      'accountOriginalNumber', // 'Account originalNumber'
      'accountType', // 'Account type'
      'accountBalance', // 'Account balance'
      'accountComingBalance', // 'Account coming balance'
      'accountIban', // Account IBAN
      'accountVendorDeleted', // 'Account vendorDeleted'
      'recurrent', // Recurrent?
      'recurrenceName', // 'Recurrence name'
      'recurrenceStatus', // 'Recurrence status'
      'recurrenceFrequency', // 'Recurrence frequency'
      'tag1', // 'Tag 1'
      'tag2', // 'Tag 2'
      'tag3', // 'Tag 3'
      'tag4', // 'Tag 4'
      'tag5', // 'Tag 5'
      'vendorTransactionId', // 'Unique ID'
      'vendorAccountId' // 'Unique account ID'
    ]
  }).transform(
    transformCSV({
      transactionsById,
      accountsById,
      recurrencesById,
      tagsById
    })
  )
}

/* ------ Data reconciliation, transformation and saving ------ */

export const saveMissingAccounts = async (
  client,
  accountsById,
  { existingAccounts }
) => {
  const accounts = Object.values(accountsById)

  const reconciliatedAccounts = BankAccount.reconciliate(
    accounts,
    existingAccounts
  )

  const accountsToSave = withExistingDocIds(reconciliatedAccounts, {
    existingDocs: existingAccounts,
    matchingProperty: '_id'
  }).map(withMetadata(client))

  const savedAccounts = await saveAll(client, accountsToSave)

  return keyBy(savedAccounts, accountId)
}

const withSavedAccounts = (recurrence, { existingAccountsById }) => {
  const { accounts, accountIds, ...data } = recurrence

  if (!accountIds || accountIds?.length === 0) {
    return recurrence
  }

  const newAccounts = compact(
    accountIds.map(id => existingAccountsById[id]?._id)
  )

  return {
    ...data,
    accounts: uniq(accounts.concat(newAccounts))
  }
}

export const saveMissingRecurrences = async (
  client,
  recurrencesById,
  { existingAccountsById, existingRecurrences }
) => {
  const recurrences = Object.values(recurrencesById)

  const reconciliatedRecurrences = reconciliate(
    recurrences,
    existingRecurrences,
    recurrenceId
  )

  // XXX: no need to call withExistingDocIds here since existing recurrences'
  // `_id` and `_rev` are preserved by `reconciliate()`.
  const recurrencesToSave = reconciliatedRecurrences.map(recurrence => {
    if (recurrence._id === NOT_RECURRENT_ID) {
      return recurrence
    }

    return withMetadata(client)(
      withSavedAccounts(recurrence, { existingAccountsById })
    )
  })

  const savedRecurrences = await saveAll(client, recurrencesToSave)

  return keyBy(savedRecurrences, recurrenceId)
}

export const saveMissingTags = async (client, tagsById, { existingTags }) => {
  const tags = Object.values(tagsById)

  const reconciliatedTags = reconciliate(tags, existingTags, tagId)

  // XXX: no need to call withExistingDocIds here since existing tags' `_id` and
  // `_rev` are preserved by `reconciliate()`.
  const tagsToSave = reconciliatedTags.map(withMetadata(client))

  const savedTags = await saveAll(client, tagsToSave)

  return keyBy(savedTags, tagId)
}

export const saveMissingTransactions = async (
  client,
  transactionsById,
  { existingAccountsById, existingRecurrencesById, existingTransactions }
) => {
  const transactions = Object.values(transactionsById)

  const reconciliatedTransactions = BankTransaction.reconciliate(
    transactions,
    existingTransactions
  )

  const transactionsToSave = withExistingDocIds(reconciliatedTransactions, {
    existingDocs: existingTransactions,
    matchingProperty: 'vendorId'
  }).map(
    // eslint-disable-next-line no-unused-vars
    ({ accountId, recurrenceId, tagIds, ...data }) => {
      const account = existingAccountsById[accountId]
      const recurrence = existingRecurrencesById[recurrenceId]

      const transaction = {
        ...data,
        account: account._id
      }

      if (recurrence) {
        addRelationship(transaction, 'recurrence', recurrence)
      }

      return withMetadata(client)(transaction)
    }
  )

  const savedTransactions = await saveAll(client, transactionsToSave)

  // XXX: BankTransaction.reconciliate() does not return unchanged transactions
  // so we need to merge them with the updated ones to have a map of all
  // transactions.
  return {
    existingTransactionsById: merge(
      keyBy(existingTransactions, transactionId),
      keyBy(savedTransactions, transactionId)
    ),
    savedTransactions
  }
}

export const updateTagsRelationships = async (
  client,
  transactionsById,
  { existingTagsById, existingTransactionsById }
) => {
  const transactionsToUpdate = {}
  const tagsToUpdate = {}

  for (const [transactionId, { tagIds }] of Object.entries(transactionsById)) {
    if (tagIds.length === 0) {
      continue
    }

    const transaction = existingTransactionsById[transactionId]

    for (const id of tagIds) {
      const tag = existingTagsById[id]

      addRelationship(transaction, 'tags', [tag])
      addRelationship(tag, 'transactions', [transaction])

      if (tagsToUpdate[id] == null) {
        tagsToUpdate[id] = tag
      }
    }

    if (transactionsToUpdate[transactionId] == null) {
      transactionsToUpdate[transactionId] = transaction
    }
  }

  const updatedTransactions = await saveAll(
    client,
    Object.values(transactionsToUpdate)
  )
  updatedTransactions.map(transaction => {
    existingTransactionsById[transactionId(transaction)] = transaction
  })

  const updatedTags = await saveAll(client, Object.values(tagsToUpdate))
  updatedTags.map(tag => {
    existingTagsById[tagId(tag)] = tag
  })
}
