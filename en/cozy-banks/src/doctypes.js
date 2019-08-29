import fromPairs from 'lodash/fromPairs'
import { QueryDefinition, HasManyInPlace } from 'cozy-client'

export const RECIPIENT_DOCTYPE = 'io.cozy.mocks.recipients'
export const ACCOUNT_DOCTYPE = 'io.cozy.bank.accounts'
export const GROUP_DOCTYPE = 'io.cozy.bank.groups'
export const TRANSACTION_DOCTYPE = 'io.cozy.bank.operations'
export const SETTINGS_DOCTYPE = 'io.cozy.bank.settings'
export const BILLS_DOCTYPE = 'io.cozy.bills'
export const TRIGGER_DOCTYPE = 'io.cozy.triggers'
export const APP_DOCTYPE = 'io.cozy.apps'
export const KONNECTOR_DOCTYPE = 'io.cozy.konnectors'
export const COZY_ACCOUNT_DOCTYPE = 'io.cozy.accounts'
export const PERMISSION_DOCTYPE = 'io.cozy.permissions'

export const offlineDoctypes = [
  ACCOUNT_DOCTYPE,
  GROUP_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE,
  BILLS_DOCTYPE
]

class HasManyBills extends HasManyInPlace {
  get data() {
    return this.raw
      ? this.raw.map(doctypeId => {
          const [doctype, id] = doctypeId.split(':')
          return this.get(doctype, id)
        })
      : []
  }

  /**
   * Query is redefined since the ids are prepended with their doctype.
   * Also does not refetch if documents have already been fetched once.
   */
  static query(doc, client, assoc) {
    const included = doc[assoc.name]
    if (!included || !included.length) {
      return null
    }

    const ids = included.indexOf(':')
      ? included.map(x => x.split(':')[1])
      : included

    const docs = fromPairs(
      ids.map(id => {
        return [id, client.getDocumentFromState(assoc.doctype, id)]
      })
    )

    const missingIds = Object.keys(docs).filter(id => !docs[id])
    if (!missingIds || !missingIds.length) {
      return Object.values(docs)
    } else {
      return new QueryDefinition({ doctype: assoc.doctype, ids: missingIds })
    }
  }
}

export class HasManyReimbursements extends HasManyInPlace {
  get raw() {
    return this.target[this.name]
  }

  get data() {
    return (this.raw || []).map(reimbursement => {
      if (!reimbursement.billId) {
        return reimbursement
      }
      return {
        ...reimbursement,
        bill: this.get('io.cozy.bills', reimbursement.billId.split(':')[1])
      }
    })
  }

  static query(doc, client, assoc) {
    const included = doc[assoc.name]
    if (!included || !included.length) {
      return null
    }
    const missingIds = included
      .map(doc => doc.billId && doc.billId.split(':')[1])
      .filter(Boolean)

    return new QueryDefinition({ doctype: assoc.doctype, ids: missingIds })
  }
}

export const schema = {
  transactions: {
    doctype: TRANSACTION_DOCTYPE,
    attributes: {},
    relationships: {
      account: {
        type: 'belongs-to-in-place',
        doctype: ACCOUNT_DOCTYPE
      },
      bills: {
        type: HasManyBills,
        doctype: BILLS_DOCTYPE
      },
      reimbursements: {
        type: HasManyReimbursements,
        doctype: BILLS_DOCTYPE
      }
    }
  },
  bills: {
    doctype: BILLS_DOCTYPE
  },
  settings: {
    doctype: SETTINGS_DOCTYPE,
    attributes: {},
    relationships: {}
  },
  bankAccounts: {
    doctype: ACCOUNT_DOCTYPE,
    attributes: {},
    relationships: {
      checkingsAccount: {
        type: 'has-one',
        doctype: ACCOUNT_DOCTYPE
      }
    }
  },
  groups: {
    doctype: GROUP_DOCTYPE,
    attributes: {},
    relationships: {
      accounts: {
        type: HasManyInPlace,
        doctype: ACCOUNT_DOCTYPE
      }
    }
  },
  triggers: {
    doctype: TRIGGER_DOCTYPE,
    attributes: {},
    relationships: {}
  },
  apps: {
    doctype: APP_DOCTYPE,
    attributes: {},
    relationships: {}
  },
  konnectors: {
    doctype: KONNECTOR_DOCTYPE,
    attributes: {},
    relationships: {}
  }
}

export const accountsConn = {
  query: client => client.all(ACCOUNT_DOCTYPE),
  as: 'accounts'
}

export const groupsConn = {
  query: client => client.all(GROUP_DOCTYPE),
  as: 'groups'
}

export const triggersConn = {
  query: client => client.all(TRIGGER_DOCTYPE),
  as: 'triggers'
}

export const transactionsConn = {
  query: client =>
    client
      .all(TRANSACTION_DOCTYPE)
      .UNSAFE_noLimit()
      .include(['bills', 'account', 'reimbursements']),
  as: 'transactions'
}

export const appsConn = {
  query: client => client.all(APP_DOCTYPE),
  as: 'apps'
}

export const billsConn = {
  query: client => client.all(BILLS_DOCTYPE),
  as: 'bills'
}

export const settingsConn = {
  query: client => client.all(SETTINGS_DOCTYPE),
  as: 'settings'
}
