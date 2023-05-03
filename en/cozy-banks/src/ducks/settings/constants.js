export const DOCTYPE = 'io.cozy.bank.settings'
export const COLLECTION_NAME = 'settings'

export const DEFAULTS_SETTINGS = {
  _type: 'io.cozy.bank.settings',
  _id: 'configuration',
  id: 'configuration',
  balancesNotifications: {},
  autogroups: {
    processedAccounts: []
  },
  linkMyselfToAccounts: {
    processedAccounts: []
  },
  notifications: {
    lastSeq: 0,
    balanceLower: [
      {
        id: 0,
        value: 100,
        enabled: false
      }
    ],
    balanceGreater: [
      {
        id: 0,
        value: 1000,
        enabled: false
      }
    ],
    transactionGreater: [
      {
        id: 0,
        value: 600,
        enabled: true
      }
    ],
    healthBillLinked: {
      enabled: true
    },
    lateHealthReimbursement: {
      value: 30,
      enabled: false
    },
    delayedDebit: [
      {
        id: 0,
        enabled: false,
        value: 2
      }
    ],
    amountCensoring: {
      enabled: false
    }
  },
  categoryBudgetAlerts: [],
  billsMatching: {
    billsLastSeq: '0',
    transactionsLastSeq: '0'
  },
  appSuggestions: {
    lastSeq: 0
  },
  community: {
    localModelOverride: {
      enabled: true
    }
  },
  categorization: {
    lastSeq: 0
  },
  showIncomeCategory: true
}
