import logger from 'cozy-logger'
import { findMatchingBrand, getNotInstalledBrands } from 'ducks/brandDictionary'
import { getLabel } from 'ducks/transactions/helpers'
import { getKonnectorFromTrigger } from 'utils/triggers'
import { BankTransaction } from 'cozy-doctypes'
import AppSuggestion from './AppSuggestion'
import Trigger from './Trigger'
import flatMap from 'lodash/flatMap'
import groupBy from 'lodash/groupBy'
import get from 'lodash/get'
import set from 'lodash/set'

const log = logger.namespace('app-suggestions')

export const findSuggestionForTransaction = (
  transaction,
  brands,
  existingSuggestions
) => {
  const matchingBrand = findMatchingBrand(brands, getLabel(transaction))

  if (!matchingBrand) {
    log('info', `No matching brand found for transaction ${transaction._id}`)
    return null
  }

  const originalSuggestion = existingSuggestions.find(
    existing => existing.slug === matchingBrand.konnectorSlug
  )

  let suggestion

  if (originalSuggestion) {
    log('info', `Using existing suggestion for ${matchingBrand.konnectorSlug}`)
    suggestion = originalSuggestion
  } else {
    log(
      'info',
      `No existing suggestion for ${matchingBrand.konnectorSlug}. Creating a new one`
    )
    suggestion = AppSuggestion.init(
      matchingBrand.konnectorSlug,
      'FOUND_TRANSACTION'
    )
  }

  AppSuggestion.linkTransaction(suggestion, transaction)

  return suggestion
}

export const normalizeSuggestions = suggestions => {
  const filteredSuggestions = suggestions.filter(Boolean)

  const normalizedSuggestions = Object.values(
    groupBy(filteredSuggestions, s => s.slug)
  ).map(mergeSuggestions)

  return normalizedSuggestions
}

const mergeSuggestions = suggestions => {
  const allTransactions = flatMap(
    suggestions,
    s => s.relationships.transactions.data
  )

  return {
    ...suggestions[0],
    relationships: {
      transactions: {
        data: allTransactions
      }
    }
  }
}

export const findAppSuggestions = async setting => {
  log('info', 'Fetch transactions changes, triggers and apps suggestions')
  const [transactionsToCheck, triggers, suggestions] = await Promise.all([
    BankTransaction.fetchChanges(get(setting, 'appSuggestions.lastSeq')),
    Trigger.fetchAll(),
    AppSuggestion.fetchAll()
  ])

  log('info', `Fetched ${transactionsToCheck.documents.length} transactions`)
  log('info', `Fetched ${triggers.length} triggers`)
  log('info', `Fetched ${suggestions.length} apps suggestions`)

  set(setting, 'appSuggestions.lastSeq', transactionsToCheck.newLastSeq)

  log('info', 'Get not installed brands')
  const installedSlugs = triggers.map(getKonnectorFromTrigger)
  const brands = getNotInstalledBrands(installedSlugs)

  log('info', `${brands.length} not installed brands`)

  log('info', 'Find suggestions')
  const suggestionsFound = transactionsToCheck.documents.map(t =>
    findSuggestionForTransaction(t, brands, suggestions)
  )

  const normalizedSuggestions = normalizeSuggestions(suggestionsFound)

  log('info', `Found ${normalizedSuggestions.length} suggestions`)

  log('info', 'Save suggestions')
  for (const suggestion of normalizedSuggestions) {
    await AppSuggestion.createOrUpdate(suggestion)
  }
}
