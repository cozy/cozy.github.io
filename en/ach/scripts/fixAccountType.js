/**
 * Some io.cozy.account are lacking their account_type attribute.
 * This script find the trigger associated to the account and
 * updates the `account_type` with the `konnector` value defined
 * in the trigger.
 */

const { DOCTYPE_ACCOUNTS, DOCTYPE_TRIGGERS } = require('../libs/doctypes')

let client

const decodeBase64JSON = val => {
  try {
    return JSON.parse(Buffer.from(val, 'base64').toString())
  } catch (err) {
    return
  }
}

const findTriggers = async client => {
  const index = await client.data.defineIndex(DOCTYPE_TRIGGERS, ['_id'])
  return client.data.query(index, { selector: { _id: { $gt: null } } })
}

/**
 * Some trigger have their data encoded as JWT in `.message.Data`,
 * some just have their data in `.message`.
 */
const triggerHasData = trigger => {
  return trigger.message && (trigger.message.Data || trigger.message.account)
}

/**
 * Returns "value" of the trigger. Decode only if the message has `.Data`
 */
const decodeTriggerDataIfNecessary = trigger => {
  if (trigger.message.Data) {
    return decodeBase64JSON(trigger.message.Data)
  } else {
    return trigger.message
  }
}

const findKonnectorSlug = (triggers, account) => {
  const matchesAccount = decoded => decoded && decoded.account === account._id
  const matchingTriggerData = triggers
    .filter(triggerHasData)
    .map(decodeTriggerDataIfNecessary)
    .filter(matchesAccount)

  if (matchingTriggerData.length > 1) {
    throw new Error('More that 1 trigger matches the account')
  }
  if (matchingTriggerData.length === 0) {
    console.log('No matching konnector trigger for ' + account._id)
    return
  }
  return matchingTriggerData[0].konnector
}

const fixAccountsWithoutAccountType = async (client, dryRun = true) => {
  const index = await client.data.defineIndex(DOCTYPE_ACCOUNTS, ['_id'])
  const accounts = await client.data.query(index, {
    selector: { _id: { $gt: null } }
  })
  const triggers = (await findTriggers(client)).filter(
    x => x.worker === 'konnector'
  )

  for (let account of accounts) {
    const accountId = account._id
    console.log('Account : ' + accountId)
    if (
      account.account_type &&
      account.account_type !== 'linxo' &&
      account.account_type !== 'dev_account'
    ) {
      console.log('✅  Already has account_type ' + account.account_type)
    } else {
      const konnectorSlug = findKonnectorSlug(triggers, account)
      if (konnectorSlug) {
        account.account_type = konnectorSlug
        console.log('Found matching konnector : ' + konnectorSlug)
        if (!dryRun) {
          console.info(
            '👌  Updating ' + accountId + ' with account_type ' + konnectorSlug
          )
          await client.data.update(DOCTYPE_ACCOUNTS, account, account)
        } else {
          console.info(
            '👌  Would update ' +
              accountId +
              ' with account_type ' +
              konnectorSlug
          )
        }
      } else {
        console.log(
          '❌  Could not find matching konnector for account ' + accountId
        )
      }
    }
    console.log()
  }
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_ACCOUNTS, DOCTYPE_TRIGGERS]
  },

  run: async function(ach, dryRun = true) {
    client = ach.oldClient

    await fixAccountsWithoutAccountType(client, dryRun).catch(x => {
      console.log(x)
    })
  },
  findTriggers,
  findKonnectorSlug,
  fixAccountsWithoutAccountType
}
