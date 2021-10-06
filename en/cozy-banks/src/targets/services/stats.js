import { ACCOUNT_DOCTYPE } from 'doctypes'
import { BankAccountStats } from 'cozy-doctypes'
import keyBy from 'lodash/keyBy'
import groupBy from 'lodash/groupBy'
import logger from 'cozy-logger'
import {
  getPeriod,
  fetchTransactionsForPeriod,
  getMeanOnPeriod
} from 'ducks/stats/services'
import flag from 'cozy-flags'
import { getCategoryIdFromName } from 'ducks/categories/helpers'
import { getCategoryId } from 'ducks/transactions/helpers'
import { runService } from './service'
import { fetchSettings } from 'ducks/settings/helpers'

const log = logger.namespace('stats')

const computeBankAccountStats = async ({ client }) => {
  log('info', 'Fetching settings...')
  let setting = await fetchSettings(client)

  // The flag is needed to use local model when getting a transaction category ID
  flag('local-model-override', setting.community.localModelOverride.enabled)

  const stats = await BankAccountStats.fetchAll()
  const statsByAccountId = keyBy(
    stats,
    stat => stat.relationships.account.data._id
  )

  const period = getPeriod()
  const transactions = await fetchTransactionsForPeriod(period)

  log(
    'info',
    `${transactions.length} transactions between ${period.start} and ${period.end}`
  )

  const transactionsByAccount = groupBy(
    transactions,
    transaction => transaction.account
  )

  Object.entries(transactionsByAccount).forEach(
    async ([accountId, transactions]) => {
      const accountStats = statsByAccountId[accountId] || {}
      const transactionsByCategory = groupBy(transactions, getCategoryId)

      const getTransactionsByCategoryName = categoryName => {
        const categoryId = getCategoryIdFromName(categoryName)
        return transactionsByCategory[categoryId] || []
      }

      accountStats.periodStart = period.start
      accountStats.periodEnd = period.end

      accountStats.income = getMeanOnPeriod(
        getTransactionsByCategoryName('activityIncome'),
        period
      )

      accountStats.additionalIncome = getMeanOnPeriod(
        [
          ...getTransactionsByCategoryName('replacementIncome'),
          ...getTransactionsByCategoryName('allocations'),
          ...getTransactionsByCategoryName('rentalIncome'),
          ...getTransactionsByCategoryName('additionalIncome'),
          ...getTransactionsByCategoryName('retirement')
        ],
        period
      )

      accountStats.mortgage = getMeanOnPeriod(
        getTransactionsByCategoryName('realEstateLoan'),
        period
      )

      accountStats.loans = getMeanOnPeriod(
        [
          ...getTransactionsByCategoryName('realEstateLoan'),
          ...getTransactionsByCategoryName('consumerLoan'),
          ...getTransactionsByCategoryName('studentLoan'),
          ...getTransactionsByCategoryName('vehiculeLoan')
        ],
        period
      )

      accountStats.fixedCharges = getMeanOnPeriod(
        [
          ...getTransactionsByCategoryName('tuition'),
          ...getTransactionsByCategoryName('rent'),
          ...getTransactionsByCategoryName('homeCharges'),
          ...getTransactionsByCategoryName('homeInsurance'),
          ...getTransactionsByCategoryName('power'),
          ...getTransactionsByCategoryName('vehiculeRental'),
          ...getTransactionsByCategoryName('vehiculeInsurance')
        ],
        period
      )

      accountStats.currency = 'EUR'

      if (!accountStats.relationships) {
        accountStats.relationships = {
          account: {
            data: { _id: accountId, _type: ACCOUNT_DOCTYPE }
          }
        }
      }

      await BankAccountStats.createOrUpdate(accountStats)
    }
  )
}

runService(computeBankAccountStats)
