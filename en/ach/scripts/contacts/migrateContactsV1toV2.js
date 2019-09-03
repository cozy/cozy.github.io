const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const omit = require('lodash/omit')
const uniq = require('lodash/uniq')

const mkAPI = require('../api')
const {
  migrationDiff: diff,
  getWithInstanceLogger
} = require('../../libs/utils')

const CONTACTS_APP_NAME = 'Contacts'
const KONNECTOR_APP_NAME = 'konnector-google'
const ACCOUNT_APP_VERSION = 1
const DOCTYPE_CONTACTS = 'io.cozy.contacts'
const DOCTYPE_ACCOUNTS = 'io.cozy.accounts'
const DOCTYPE_CONTACTS_ACCOUNT = 'io.cozy.contacts.accounts'
const DOCTYPE_CONTACTS_VERSION = 2

const getCreatedByApp = contact => {
  const metadataKeys = Object.keys(contact.metadata || {}).filter(
    k => k !== 'version'
  )

  if (metadataKeys.includes('google')) {
    return KONNECTOR_APP_NAME
  } else {
    return CONTACTS_APP_NAME
  }
}

const filterContact = contact => {
  const filteredContact = omit(
    contact,
    'vendorId',
    'metadata.cozy',
    'metadata.version'
  )
  if (isEmpty(filteredContact.metadata)) {
    filteredContact.metadata = undefined
  }

  return filteredContact
}

const migrateContactV1toV2 = (contact, contactsAccountsMapping) => {
  const now = new Date().toISOString()
  const createdByApp = getCreatedByApp(contact)
  let accounts = []
  const contactAccountId = get(
    contactsAccountsMapping,
    get(contact, 'metadata.google.from'),
    null
  )
  let sync
  if (contactAccountId && createdByApp === KONNECTOR_APP_NAME) {
    sync = {
      [contactAccountId]: {
        contactsAccountsId: contactAccountId,
        id: contact.vendorId,
        konnector: KONNECTOR_APP_NAME,
        lastSync: now,
        remoteRev: undefined
      }
    }
    accounts = [
      {
        _id: contactAccountId,
        _type: DOCTYPE_CONTACTS_ACCOUNT
      }
    ]
  }

  return {
    ...filterContact(contact),
    me: false,
    cozyMetadata: {
      sync,
      createdAt: undefined,
      createdByApp,
      createdByAppVersion: undefined,
      doctypeVersion: DOCTYPE_CONTACTS_VERSION,
      sourceAccount: null,
      updatedAt: now,
      updatedByApps: [
        {
          date: now,
          slug: createdByApp,
          version: undefined
        }
      ]
    },
    relationships: {
      ...contact.relationships,
      accounts: {
        data: accounts
      }
    }
  }
}

const createContactAccount = accountName => ({
  canLinkContacts: true,
  shouldSyncOrphan: true,
  lastSync: null,
  lastLocalSync: null,
  name: accountName,
  type: KONNECTOR_APP_NAME,
  sourceAccount: null,
  version: ACCOUNT_APP_VERSION
})

async function doMigrations(dryRun, api, logWithInstance) {
  if (!dryRun) {
    const result = await api.createDoctype(DOCTYPE_CONTACTS_ACCOUNT)
    if (!result.ok) {
      logWithInstance(`Failed to create ${DOCTYPE_CONTACTS_ACCOUNT}`)
      return
    }
  }

  const contacts = await api.fetchAll(DOCTYPE_CONTACTS)
  if (contacts.length === 0) {
    logWithInstance('No contacts, nothing to migrate')
    return
  }

  const accountsNames = uniq(
    contacts
      .map(contact => get(contact, 'metadata.google.from'))
      .filter(name => name !== undefined)
  )

  let contactsAccountsMapping = {}
  const contactsAccounts = accountsNames.map(name => createContactAccount(name))
  if (dryRun) {
    contactsAccounts.forEach(contactAccount => {
      logWithInstance('Dry run: would create contact account', contactAccount)
      const name = contactAccount.name
      contactsAccountsMapping[name] = `contactAccount-${name}`
    })
  } else {
    await api.updateAll(DOCTYPE_CONTACTS_ACCOUNT, contactsAccounts)
    const createdContactsAccounts = await api.fetchAll(DOCTYPE_CONTACTS_ACCOUNT)
    contactsAccountsMapping = createdContactsAccounts.reduce(
      (mapping, contactAccount) => ({
        ...mapping,
        [contactAccount.name]: contactAccount._id
      }),
      {}
    )
  }

  const updatedContacts = contacts.map(contact =>
    migrateContactV1toV2(contact, contactsAccountsMapping)
  )

  if (!dryRun) {
    await api.updateAll(DOCTYPE_CONTACTS, updatedContacts)
  } else {
    logWithInstance(
      'Dry run: first updated contact\n',
      diff(contacts[0], updatedContacts[0])
    )
  }

  logWithInstance(
    dryRun ? 'Would create' : 'Has created',
    Object.keys(contactsAccountsMapping).length,
    DOCTYPE_CONTACTS_ACCOUNT
  )

  logWithInstance(
    dryRun ? 'Would update' : 'Has updated',
    contacts.length,
    DOCTYPE_CONTACTS
  )
}

module.exports = {
  getDoctypes: function() {
    return [DOCTYPE_ACCOUNTS, DOCTYPE_CONTACTS, DOCTYPE_CONTACTS_ACCOUNT]
  },

  run: async function(ach, dryRun = true) {
    const api = mkAPI(ach.client)
    const logWithInstance = getWithInstanceLogger(ach.client)
    try {
      await doMigrations(dryRun, api, logWithInstance)
    } catch (err) {
      console.log(ach.url, err)
    }
  }
}
