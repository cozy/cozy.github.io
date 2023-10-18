import logger from 'cozy-logger'
import { findMatchingBrand, getNotInstalledBrands } from 'ducks/brandDictionary'
import { getLabel } from 'ducks/transactions/helpers'
import { trigger as triggerLibs } from 'cozy-client/dist/models'
import { BankTransaction } from 'cozy-doctypes'
import AppSuggestion from './AppSuggestion'
import Trigger from './Trigger'
import flatMap from 'lodash/flatMap'
import groupBy from 'lodash/groupBy'
import get from 'lodash/get'
import set from 'lodash/set'

const log = logger.namespace('app-suggestions')
const { getKonnector } = triggerLibs.triggers

export const findSuggestionForTransaction = (
  transaction,
  brands,
  existingSuggestions
) => {
  const matchingBrand = findMatchingBrand(brands, getLabel(transaction))

  if (!matchingBrand) {
    log('debug', `No matching brand found for transaction ${transaction._id}`)
    return null
  }

  const originalSuggestion = existingSuggestions.find(
    existing => existing.slug === matchingBrand.konnectorSlug
  )

  let suggestion

  if (originalSuggestion) {
    log('debug', `Using existing suggestion for ${matchingBrand.konnectorSlug}`)
    suggestion = originalSuggestion
  } else if (matchingBrand.konnectorSlug) {
    log(
      'debug',
      `No existing suggestion for ${matchingBrand.konnectorSlug}. Creating a new one`
    )
    suggestion = AppSuggestion.init(
      matchingBrand.konnectorSlug,
      'FOUND_TRANSACTION'
    )
  } else {
    return null
  }

  AppSuggestion.linkTransaction(suggestion, transaction)

  return suggestion
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

export const normalizeSuggestions = suggestions => {
  const filteredSuggestions = suggestions.filter(Boolean)

  const normalizedSuggestions = Object.values(
    groupBy(filteredSuggestions, s => s.slug)
  ).map(mergeSuggestions)

  return normalizedSuggestions
}

export const findAppSuggestions = async (setting, brands) => {
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
  const installedSlugs = triggers.map(getKonnector)
  const notInstalledBrands = getNotInstalledBrands(installedSlugs, brands)

  log('info', `${notInstalledBrands.length} not installed brands`)

  log('info', 'Find suggestions')
  const suggestionsFound = transactionsToCheck.documents.map(t =>
    findSuggestionForTransaction(t, notInstalledBrands, suggestions)
  )

  const normalizedSuggestions = normalizeSuggestions(suggestionsFound)

  log('info', `Found ${normalizedSuggestions.length} suggestions`)

  log('info', 'Save suggestions')
  for (const suggestion of normalizedSuggestions) {
    await AppSuggestion.createOrUpdate(suggestion)
  }
}
