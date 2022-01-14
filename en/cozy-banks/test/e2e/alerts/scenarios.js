import keyBy from 'lodash/keyBy'
import demoData from 'test/fixtures/demo.json'
import { getDocumentID } from 'ducks/client/utils'
import {
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE
} from 'doctypes'

const LOUISE_ACCOUNT_ID = 'comptelou1'
const ISA_CHECKING_ACCOUNT_ID = 'compteisa1'
const ISA_SAVING_ACCOUNT_ID = 'compteisa3'
const GENEVIEVE_ACCOUNT_ID = 'comptegene1'

const demoAccountsById = keyBy(demoData['io.cozy.bank.accounts'], getDocumentID)
const louiseCheckings = demoAccountsById[LOUISE_ACCOUNT_ID]
const isabelleCheckings = demoAccountsById[ISA_CHECKING_ACCOUNT_ID]
const isabelleSavings = demoAccountsById[ISA_SAVING_ACCOUNT_ID]

const louiseBurgerTransaction = {
  demo: false,
  automaticCategoryId: '400160',
  account: LOUISE_ACCOUNT_ID,
  label: 'Burger pour Louise',
  amount: -8,
  date: new Date().toISOString(),
  _id: 'louise_burger'
}

const isaBurgerTransaction = {
  ...louiseBurgerTransaction,
  account: ISA_CHECKING_ACCOUNT_ID,
  label: 'Burger pour Isabelle',
  _id: 'isa_burger'
}

const balanceLower100OnLouiseAccount = {
  value: 100,
  accountOrGroup: {
    _id: LOUISE_ACCOUNT_ID,
    _type: ACCOUNT_DOCTYPE
  },
  enabled: true
}

const transactionGreater5OnLouiseAccount = {
  value: 5,
  accountOrGroup: {
    _id: LOUISE_ACCOUNT_ID,
    _type: ACCOUNT_DOCTYPE
  },
  enabled: true
}

const transactionGreater50OnIsaCheckings = {
  value: 50,
  accountOrGroup: {
    _id: ISA_CHECKING_ACCOUNT_ID,
    _type: ACCOUNT_DOCTYPE
  },
  enabled: true
}

const balanceLower300OnAllAccounts = {
  value: 300,
  accountOrGroup: null,
  enabled: true
}

const settingsWith2BalanceLowerRules = {
  _id: 'notificationSettings',
  notifications: {
    balanceLower: [balanceLower100OnLouiseAccount, balanceLower300OnAllAccounts]
  }
}

const genevieveTransaction = {
  account: GENEVIEVE_ACCOUNT_ID,
  amount: 0,
  label: 'Fake transaction',
  date: new Date(),
  _id: 'gen_fake_transaction'
}

const scenarios = {
  balanceLower1: {
    description: 'Notification for Louise checking account',
    expected: {
      email: {
        subject: "Balance alert: 'Louise checkings' account is at 150€"
      },
      notification: {
        data: {
          body: 'Louise checkings +150€',
          route: '/balances',
          title: "Balance alert: 'Louise checkings' account is at 150€"
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [settingsWith2BalanceLowerRules],
      [ACCOUNT_DOCTYPE]: [
        {
          ...louiseCheckings,
          balance: 150
        },
        {
          ...isabelleCheckings,
          balance: 350
        },
        {
          ...isabelleSavings,
          balance: 5000
        }
      ],
      [TRANSACTION_DOCTYPE]: [louiseBurgerTransaction, isaBurgerTransaction]
    }
  },
  balanceLower2: {
    description:
      'Notification for Louise checking account < 250 and Isabelle checking account < 300',
    expected: {
      email: {
        subject: '2 accounts are below your threshold amount of 300€'
      },
      notification: {
        data: {
          body: 'Isabelle checkings +290€, Louise checkings +150€',
          route: '/balances',
          title: '2 accounts are below your threshold amount of 300€'
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [settingsWith2BalanceLowerRules],
      [ACCOUNT_DOCTYPE]: [
        {
          ...louiseCheckings,
          balance: 150
        },
        {
          ...isabelleCheckings,
          balance: 290
        },
        {
          ...isabelleSavings,
          balance: 5000
        }
      ],
      [TRANSACTION_DOCTYPE]: [louiseBurgerTransaction, isaBurgerTransaction]
    }
  },
  balanceLower3: {
    description:
      'No notification (Louise checking account is above the threshold, only 1 rule)',
    expected: { email: null, notification: null },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            balanceLower: [balanceLower100OnLouiseAccount]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [
        {
          ...louiseCheckings,
          balance: 150
        },
        {
          ...isabelleCheckings,
          balance: 90
        },
        {
          ...isabelleSavings,
          balance: 5000
        }
      ],
      [TRANSACTION_DOCTYPE]: [louiseBurgerTransaction, isaBurgerTransaction]
    }
  },
  balanceLower4: {
    description:
      'No notification (transactions are not new, no notification triggered)',
    expected: { email: null, notification: null },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            balanceLower: [balanceLower100OnLouiseAccount]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [
        {
          ...louiseCheckings,
          balance: 150
        },
        {
          ...isabelleCheckings,
          balance: 90
        },
        {
          ...isabelleSavings,
          balance: 5000
        }
      ],
      [TRANSACTION_DOCTYPE]: [genevieveTransaction]
    }
  },
  transactionGreater1: {
    description: 'Debit of 60€',
    expected: {
      email: {
        subject: 'Debit of 60€'
      },
      notification: {
        data: {
          body: 'Burger pour Isabelle : -60€',
          route: '/transactions',
          title: 'Debit of 60€'
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            transactionGreater: [transactionGreater50OnIsaCheckings]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [louiseCheckings, isabelleCheckings],
      [TRANSACTION_DOCTYPE]: [
        {
          ...isaBurgerTransaction,
          amount: -60 // such an expensive burger !
        }
      ]
    }
  },
  transactionGreater2: {
    description: '2 transactions, single rule',
    expected: {
      email: {
        subject: '2 transactions greater than 50€'
      },
      notification: {
        data: {
          body: 'Isabelle checkings: 2 transactions',
          route: '/transactions',
          title: '2 transactions greater than 50€'
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            transactionGreater: [
              transactionGreater5OnLouiseAccount,
              transactionGreater50OnIsaCheckings
            ]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [louiseCheckings, isabelleCheckings],
      [TRANSACTION_DOCTYPE]: [
        { ...isaBurgerTransaction, _id: 'isa_burger_0', amount: -100 },
        {
          ...isaBurgerTransaction,
          amount: -60 // such an expensive burger !
        }
      ]
    }
  },
  transactionGreater3: {
    description: '3 transactions, multi rules',
    expected: {
      email: {
        subject: '3 transactions greater than 2 thresholds'
      },
      notification: {
        data: {
          body: 'Louise checkings: 1 transaction, Isabelle checkings: 2 transactions',
          route: '/transactions',
          title: '3 transactions greater than 2 thresholds'
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            transactionGreater: [
              transactionGreater5OnLouiseAccount,
              transactionGreater50OnIsaCheckings
            ]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [louiseCheckings, isabelleCheckings],
      [TRANSACTION_DOCTYPE]: [
        { ...louiseBurgerTransaction, amount: -10 },
        {
          ...isaBurgerTransaction,
          amount: -60 // such an expensive burger !
        },
        {
          ...isaBurgerTransaction,
          _id: 'isa_burger_0',
          amount: -100 // such an expensive burger !
        }
      ]
    }
  },
  delayedDebit1: {
    description: 'CreditCard account below Checkings account',
    expected: {
      email: {
        subject:
          "Account 'Checkings 1' will be at -50€ after your credit  card debit"
      },
      notification: {
        data: {
          body: '',
          route: '/balances',
          title:
            "Account 'Checkings 1' will be at -50€ after your credit card debit"
        }
      }
    },
    data: {
      [SETTINGS_DOCTYPE]: [
        {
          _id: 'notificationSettings',
          notifications: {
            delayedDebit: [
              {
                enabled: true,
                checkingsAccount: {
                  _id: 'checkings1',
                  _type: ACCOUNT_DOCTYPE
                },
                creditCardAccount: {
                  _id: 'creditcard1',
                  _type: ACCOUNT_DOCTYPE
                },
                // this way we are always in the range
                // end of month - value < now < end of the month
                value: 50
              }
            ]
          }
        }
      ],
      [ACCOUNT_DOCTYPE]: [
        {
          _id: 'creditcard1',
          balance: -100,
          label: 'Credit card 1'
        },
        {
          _id: 'checkings1',
          balance: 50,
          label: 'Checkings 1'
        },
        {
          _id: 'creditcard2',
          balance: -50,
          label: 'Credit card 2'
        },
        {
          _id: 'checkings2',
          balance: 100,
          label: 'Checkings 2'
        }
      ],
      [TRANSACTION_DOCTYPE]: [
        { ...louiseBurgerTransaction, amount: -10 },
        {
          ...isaBurgerTransaction,
          amount: -60 // such an expensive burger !
        },
        {
          ...isaBurgerTransaction,
          _id: 'isa_burger_0',
          amount: -100 // such an expensive burger !
        }
      ]
    }
  }
}

export default scenarios
