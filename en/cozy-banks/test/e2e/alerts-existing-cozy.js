/* eslint-disable no-console */

import { ArgumentParser } from 'argparse'

import { createClientInteractive } from 'cozy-client/dist/cli'
import {
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE,
  GROUP_DOCTYPE,
  BILLS_DOCTYPE
} from '../../src/doctypes'
import { getDocumentID } from './dataUtils'
import { ruleAccountFilter } from '../../src/ducks/settings/ruleUtils'
import keyBy from 'lodash/keyBy'
import omit from 'lodash/omit'
import inquirer from 'inquirer'
import { getAccountLabel } from '../../src/ducks/account/helpers'
import { getGroupLabel } from '../../src/ducks/groups/helpers'

const CREATED_BY_APP_ID = 'io.cozy.banks.dev-alerts-existing-cozy'

const parseArgs = () => {
  const parser = new ArgumentParser()
  parser.addArgument('mode', { choices: ['insert', 'cleanup'] })
  parser.addArgument('--url', { defaultValue: 'http://cozy.tools:8080' })
  parser.addArgument(['-v', '--verbose'], { action: 'storeTrue' })
  return parser.parseArgs()
}

const ruleFormatter = formatAccountOrGroup => {
  return rule => {
    return `Rule<${rule.value} for ${formatAccountOrGroup(
      rule.accountOrGroup
    )}>`
  }
}

const accountOrGroupFormatter = (accountsById, groupsById) => {
  return accountOrGroup => {
    if (!accountOrGroup) {
      return 'all accounts'
    } else if (accountOrGroup._type === ACCOUNT_DOCTYPE) {
      const fakeT = x => x
      return (
        getAccountLabel(accountsById[accountOrGroup._id], fakeT) ||
        'Unknown account'
      )
    } else if (accountOrGroup._type === GROUP_DOCTYPE) {
      const fakeT = x => x
      return (
        getGroupLabel(groupsById[accountOrGroup._id], fakeT) || 'Unknown group'
      )
    } else {
      return `Unknown<_type: ${accountOrGroup._type}, _id: ${accountOrGroup._id}>`
    }
  }
}

const isDesignDoc = x => x._id.startsWith('_design')
const fetchData = async client => {
  const { data: settings } = await client.collection(SETTINGS_DOCTYPE).getAll()
  const { data: accounts } = await client.collection(ACCOUNT_DOCTYPE).getAll()
  const { data: groups } = await client.collection(GROUP_DOCTYPE).getAll()
  return {
    settings: settings.filter(x => !isDesignDoc(x)),
    accounts: accounts.filter(x => !isDesignDoc(x)),
    groups: groups.filter(x => !isDesignDoc(x))
  }
}

const formatTransaction = transaction => {
  return `Transaction<${transaction.label}, ${transaction.amount}>`
}

const chooseAccount = async accounts => {
  const prompt = inquirer.createPromptModule()
  const answers = await prompt([
    {
      name: 'chosenAccount',
      message: 'Create transaction on which account ?',
      type: 'list',
      choices: accounts.map(account => ({
        value: account,
        name: account.label
      }))
    }
  ])
  return answers.chosenAccount
}

const insertFakeDocuments = async client => {
  const {
    settings: allSettings,
    accounts: allAccounts,
    groups: allGroups
  } = await fetchData(client)

  const notificationSettings = allSettings.find(
    setting => setting.notifications
  )
  const balanceLowerRules = notificationSettings.notifications.balanceLower

  const accountsById = keyBy(allAccounts, getDocumentID)
  const groupsById = keyBy(allGroups, getDocumentID)
  const formatAccountOrGroup = accountOrGroupFormatter(accountsById, groupsById)
  const formatRule = ruleFormatter(formatAccountOrGroup)

  console.log('Existing rules:')
  console.log(
    balanceLowerRules
      .map(formatRule)
      .map(x => `- ${x}`)
      .join('\n')
  )

  for (const rule of balanceLowerRules) {
    const correspondingAccounts = allAccounts.filter(
      ruleAccountFilter(rule, allGroups)
    )
    let chosenAccountId
    if (correspondingAccounts.length > 1) {
      console.log(
        'More than 1 corresponding account for rule',
        formatRule(rule)
      )
      chosenAccountId = (await chooseAccount(correspondingAccounts))._id
    } else if (correspondingAccounts.length === 1) {
      chosenAccountId = correspondingAccounts[0]._id
    } else {
      console.warn('No account for rule', formatRule(rule), '. Bailing out.')
      continue
    }

    const SNACKS_CATEGORY_ID = '400160'
    const transaction = {
      label: `Fake transaction for ${formatRule(rule)}`,
      amount: -9,
      account: chosenAccountId,
      _type: TRANSACTION_DOCTYPE,
      manualCategoryId: SNACKS_CATEGORY_ID,
      date: new Date().toISOString(),
      cozyMetadata: {
        createdByApp: CREATED_BY_APP_ID
      }
    }

    console.log('Creating transaction', {
      transaction: formatTransaction(transaction),
      rule: formatRule(rule),
      account: formatAccountOrGroup(accountsById[chosenAccountId])
    })
    console.log('Saving transaction...')
    const { data: newTransaction } = await client.save(transaction)

    // We have to fake an update to wake up the onOperationOrBillCreate service
    console.log('Updating transaction...')
    await client.save({
      ...newTransaction,
      amount: -10
    })
  }
  console.log('Saving fake bill')
  const { data: newBill } = await client.save({
    _type: BILLS_DOCTYPE,
    cozyMetadata: {
      createdByApp: CREATED_BY_APP_ID
    },
    amount: 0,
    vendor: CREATED_BY_APP_ID,
    label: 'Fake bill to wake up onOperationOrBillCreate'
  })
  console.log(newBill)
}

const cleanupFakeDocumentsForDoctype = async (client, doctype) => {
  console.log(`Fetching fake ${doctype}...`)
  const { data: fakeDocuments } = await client.query({
    doctype: doctype,
    selector: {
      'cozyMetadata.createdByApp': CREATED_BY_APP_ID
    }
  })
  console.log(`Found ${fakeDocuments.length} fake ${doctype}`)
  console.log(`Cleaning up ${fakeDocuments.length} fake ${doctype}...`)

  // The omit for _type can be removed when the following PR is resolved
  // https://github.com/cozy/cozy-client/pull/597
  const resp = await client.stackClient
    .collection(doctype)
    .destroyAll(fakeDocuments.map(x => omit(x, '_type')))
  console.log(resp)
}

const cleanupFakeDocuments = async client => {
  await cleanupFakeDocumentsForDoctype(client, TRANSACTION_DOCTYPE)
  await cleanupFakeDocumentsForDoctype(client, BILLS_DOCTYPE)
}

const main = async () => {
  const args = parseArgs()
  const client = await createClientInteractive({
    uri: args.url,
    scope: [
      SETTINGS_DOCTYPE,
      TRANSACTION_DOCTYPE,
      ACCOUNT_DOCTYPE,
      GROUP_DOCTYPE,
      BILLS_DOCTYPE
    ],
    oauth: {
      softwareID: 'banks.alerts-e2e-existing-cozy'
    }
  })
  if (args.mode === 'insert') {
    await insertFakeDocuments(client)
  } else if (args.mode === 'cleanup') {
    await cleanupFakeDocuments(client)
  }
}
// eslint-disable-next-line
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  // eslint-disable-next-line
  .then(() => {
    process.exit(0)
  })
