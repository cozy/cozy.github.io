const {
  DOCTYPE_ACCOUNTS,
  DOCTYPE_KONNECTORS,
  DOCTYPE_PERMISSIONS
} = require('../../libs/doctypes')
const mkAPI = require('../api')
const log = require('cozy-logger').namespace('create-agg-account')

const AGGREGATOR_ACCOUNT_ID = 'bi-aggregator'
const BANKING_KONNECTOR_SLUGS = [
  'axabanque102',
  'banquepopulaire',
  'barclays136',
  'bforbank97',
  'bnpparibas82',
  'boursorama83',
  'bred',
  'caatlantica3',
  'caissedepargne1',
  'carrefour159',
  'casden173',
  'cdngroup109',
  'cdngroup88',
  'cic45',
  'cic63',
  'comptenickel168',
  'creditcooperatif148',
  'creditmaritime',
  'fortuneo84',
  'hellobank145',
  'hsbc119',
  'ingdirect95',
  'labanquepostale44',
  'lcl-linxo',
  'monabanq96',
  'societegenerale'
]

const utils = {}

utils.ensureAggregatorAccountExists = async (client, dryRun) => {
  let agg
  try {
    agg = await client.fetchJSON(
      'GET',
      `/data/${DOCTYPE_ACCOUNTS}/${AGGREGATOR_ACCOUNT_ID}`
    )
    log('debug', 'BI aggregator account already exists')
  } catch (e) {
    agg = null
  }
  if (agg) {
    return { created: false, already: true }
  }
  log('debug', `Need to create ${DOCTYPE_ACCOUNTS}:${AGGREGATOR_ACCOUNT_ID}...`)
  if (dryRun) {
    log(
      'debug',
      `Would have created ${DOCTYPE_ACCOUNTS}:${AGGREGATOR_ACCOUNT_ID}...`
    )
  } else {
    return client.fetchJSON(
      'PUT',
      `/data/${DOCTYPE_ACCOUNTS}/${AGGREGATOR_ACCOUNT_ID}`,
      {}
    )
  }
  return { created: true }
}

utils.fetchAllBankingKonnectors = async client => {
  const konnectors = await client.fetchJSON('GET', `/konnectors/`)
  return konnectors.filter(konn => {
    return BANKING_KONNECTOR_SLUGS.includes(konn.attributes.slug)
  })
}

const ensureKonnectorHasAggregatorPermissions = async (
  client,
  konn,
  dryRun
) => {
  log('debug', `Ensuring konnector has permission on aggregator account...`)
  const konnSlug = konn.attributes.slug
  if (dryRun) {
    log(
      'debug',
      `Would have added permission on ${AGGREGATOR_ACCOUNT_ID} to ${konnSlug}`
    )
  } else {
    await client.fetchJSON('PATCH', `/permissions/konnectors/${konnSlug}`, {
      data: {
        type: 'io.cozy.permissions',
        attributes: {
          permissions: {
            aggregatorAccount: {
              type: DOCTYPE_ACCOUNTS,
              verbs: ['GET', 'PUT'],
              values: [`${DOCTYPE_ACCOUNTS}.${AGGREGATOR_ACCOUNT_ID}`]
            }
          }
        }
      }
    })
    log('debug', `Added permission on ${AGGREGATOR_ACCOUNT_ID} to ${konnSlug}`)
  }
  return { ok: true }
}

utils.ensureKonnectorsHaveAggregatorPermission = async (
  client,
  bankingKonnectors,
  dryRun
) => {
  log(
    'debug',
    `Banking konnectors: ${bankingKonnectors
      .map(konn => konn.attributes.slug)
      .join(', ')}`
  )
  const res = {}
  for (const konn of bankingKonnectors) {
    res[konn._id] = await ensureKonnectorHasAggregatorPermissions(
      client,
      konn,
      dryRun
    )
  }
  return res
}

const ensureAccountHasRelationship = async (client, account, dryRun) => {
  if (account.relationships && account.relationships.parent) {
    return { created: false, already: true }
  } else {
    log(
      'debug',
      `Adding "parent" relationship to ${AGGREGATOR_ACCOUNT_ID} to ${account._id}...`
    )
    if (dryRun) {
      log(
        'debug',
        `Would have added "parent" relationship to ${AGGREGATOR_ACCOUNT_ID} to ${account._id}`
      )
    } else {
      await client.data.updateAttributes(DOCTYPE_ACCOUNTS, account._id, {
        relationships: {
          ...(account.relationships || {}),
          parent: {
            data: {
              _id: AGGREGATOR_ACCOUNT_ID,
              _type: DOCTYPE_ACCOUNTS
            }
          }
        }
      })
      log(
        'debug',
        `Added "parent" relationship to ${AGGREGATOR_ACCOUNT_ID} to ${account._id}`
      )
    }
    return { created: true }
  }
}

const fetchAllBankingAccounts = async client => {
  const allAccounts = await client.fetchJSON(
    'GET',
    `/data/${DOCTYPE_ACCOUNTS}/_normal_docs`
  )
  return allAccounts.rows.filter(account =>
    BANKING_KONNECTOR_SLUGS.includes(account.account_type)
  )
}

utils.ensureBankingAccountsHaveAggregatorRelationship = async (
  client,
  dryRun
) => {
  const accounts = await fetchAllBankingAccounts(client)
  const res = {}
  for (let acc of accounts) {
    res[acc._id] = await ensureAccountHasRelationship(client, acc, dryRun)
  }
  return res
}

utils.run = async (api, client, dryRun) => {
  const bankingKonnectors = await utils.fetchAllBankingKonnectors(client)
  if (bankingKonnectors.length === 0) {
    log('info', 'No banking konnector, aborting...')
    return { aborted: true }
  } else {
    const infoAgg = await utils.ensureAggregatorAccountExists(client, dryRun)
    const infoPermissions = await utils.ensureKonnectorsHaveAggregatorPermission(
      client,
      bankingKonnectors,
      dryRun
    )
    const infoRelationships = await utils.ensureBankingAccountsHaveAggregatorRelationship(
      client,
      dryRun
    )
    return {
      aggregator: infoAgg,
      permissions: infoPermissions,
      relationships: infoRelationships,
      dryRun
    }
  }
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_ACCOUNTS, DOCTYPE_KONNECTORS, DOCTYPE_PERMISSIONS]
  },
  utils,
  log,
  run: async function(ach, dryRun = true) {
    return utils.run(mkAPI(ach.oldClient), ach.oldClient, dryRun).catch(err => {
      return {
        error: {
          message: err.message,
          stack: err.stack
        }
      }
    })
  }
}
