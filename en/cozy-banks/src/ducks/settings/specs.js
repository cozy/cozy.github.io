/**
 * Contains edition specs for alerts settings
 *
 * - How an alert is shown (which locales, which properties)
 * - How an alert is edited (which fields)
 */

import { isCheckingsAccount, isCreditCardAccount } from 'ducks/account/helpers'

import { CHOOSING_TYPES } from 'components/EditionModal'
import { getDocumentIdentity } from 'ducks/client/utils'
import {
  getAccountOrGroupChoiceFromAlert,
  getCategoryChoiceFromAlert,
  getMaxThresholdChoiceFromAlert,
  updatedAlertFromAccountOrGroupChoice,
  updatedAlertFromCategoryChoice,
  updatedAlertFromMaxThresholdChoice
} from './CategoryAlerts/helpers'

const getValueFromNotification = notification => notification.value
const updatedNotificationFromValue = (notification, value) => ({
  ...notification,
  value
})

const getAccountOrGroupFromNotification = notification =>
  notification.accountOrGroup
const updatedNotificationFromAccountGroup = (notification, accountOrGroup) => ({
  ...notification,
  accountOrGroup: getDocumentIdentity(accountOrGroup)
})

export const balanceLower = {
  modalTitle: 'Notifications.editModal.title',
  fieldSpecs: {
    value: {
      type: CHOOSING_TYPES.number,
      getValue: getValueFromNotification,
      updater: updatedNotificationFromValue,
      sectionProps: {
        unit: '€'
      }
    },
    accountOrGroup: {
      type: CHOOSING_TYPES.accountOrGroup,
      getValue: getAccountOrGroupFromNotification,
      updater: updatedNotificationFromAccountGroup
    }
  },
  fieldOrder: ['value', 'accountOrGroup'],
  fieldLabels: {
    value: 'Notifications.if-balance-lower.fieldLabels.value',
    accountOrGroup: 'Notifications.if-balance-lower.fieldLabels.accountOrGroup'
  }
}

export const balanceGreater = {
  modalTitle: 'Notifications.editModal.title',
  fieldSpecs: {
    value: {
      type: CHOOSING_TYPES.number,
      getValue: getValueFromNotification,
      updater: updatedNotificationFromValue,
      sectionProps: {
        unit: '€'
      }
    },
    accountOrGroup: {
      type: CHOOSING_TYPES.accountOrGroup,
      getValue: getAccountOrGroupFromNotification,
      updater: updatedNotificationFromAccountGroup
    }
  },
  fieldOrder: ['value', 'accountOrGroup'],
  fieldLabels: {
    value: 'Notifications.if-balance-greater.fieldLabels.value',
    accountOrGroup:
      'Notifications.if-balance-greater.fieldLabels.accountOrGroup'
  }
}

export const transactionGreater = {
  modalTitle: 'Notifications.editModal.title',
  fieldSpecs: {
    value: {
      type: CHOOSING_TYPES.number,
      getValue: getValueFromNotification,
      updater: updatedNotificationFromValue,
      sectionProps: {
        unit: '€'
      }
    },
    accountOrGroup: {
      type: CHOOSING_TYPES.accountOrGroup,
      getValue: getAccountOrGroupFromNotification,
      updater: updatedNotificationFromAccountGroup
    }
  },
  fieldOrder: ['value', 'accountOrGroup'],
  fieldLabels: {
    value: 'Notifications.if-transaction-greater.fieldLabels.value',
    accountOrGroup:
      'Notifications.if-transaction-greater.fieldLabels.accountOrGroup'
  }
}

export const lateHealthReimbursement = {
  modalTitle: 'Notifications.editModal.title',
  fieldSpecs: {
    value: {
      type: CHOOSING_TYPES.number,
      getValue: getValueFromNotification,
      updater: updatedNotificationFromValue,
      sectionProps: {
        unitKey: 'Notifications.when-late-health-reimbursement.unit'
      }
    }
  },
  fieldOrder: ['value'],
  fieldLabels: {
    value: 'Notifications.when-late-health-reimbursement.fieldLabels.value'
  }
}

export const categoryBudgets = {
  modalTitle: 'Settings.budget-category-alerts.edit.modal-title',
  fieldOrder: ['accountOrGroup', 'category', 'maxThreshold'],
  fieldLabels: {
    accountOrGroup: 'Settings.budget-category-alerts.edit.account-group-label',
    category: 'Settings.budget-category-alerts.edit.category-label',
    maxThreshold: 'Settings.budget-category-alerts.edit.threshold-label'
  },
  fieldSpecs: {
    accountOrGroup: {
      type: CHOOSING_TYPES.accountOrGroup,
      getValue: getAccountOrGroupChoiceFromAlert,
      updater: updatedAlertFromAccountOrGroupChoice
    },
    category: {
      type: CHOOSING_TYPES.category,
      getValue: getCategoryChoiceFromAlert,
      updater: updatedAlertFromCategoryChoice
    },
    maxThreshold: {
      type: CHOOSING_TYPES.threshold,
      getValue: getMaxThresholdChoiceFromAlert,
      updater: updatedAlertFromMaxThresholdChoice
    }
  }
}

const makeAccountChoiceFromAccount = account => {
  return account ? getDocumentIdentity(account) : null
}

export const delayedDebits = {
  modalTitle: 'Notifications.editModal.title',
  fieldOrder: ['creditCardAccount', 'checkingsAccount', 'value'],
  fieldLabels: {
    creditCardAccount:
      'Notifications.delayed-debit.fieldLabels.creditCardAccount',
    checkingsAccount:
      'Notifications.delayed-debit.fieldLabels.checkingsAccount',
    value: 'Notifications.delayed-debit.fieldLabels.days'
  },
  fieldSpecs: {
    creditCardAccount: {
      type: CHOOSING_TYPES.account,
      chooserProps: {
        canSelectAll: false,
        filter: isCreditCardAccount
      },
      getValue: initialDoc =>
        makeAccountChoiceFromAccount(initialDoc.creditCardAccount),
      updater: (doc, creditCardAccount) => ({
        ...doc,
        creditCardAccount: getDocumentIdentity(creditCardAccount)
      })
    },
    checkingsAccount: {
      type: CHOOSING_TYPES.account,
      chooserProps: {
        canSelectAll: false,
        filter: isCheckingsAccount
      },
      getValue: initialDoc =>
        makeAccountChoiceFromAccount(initialDoc.checkingsAccount),
      updater: (doc, checkingsAccount) => ({
        ...doc,
        checkingsAccount: getDocumentIdentity(checkingsAccount)
      })
    },
    value: {
      sectionProps: {
        unitKey: 'Notifications.delayed-debit.unit'
      },
      type: CHOOSING_TYPES.number,
      getValue: doc => doc.value,
      updater: (doc, value) => ({ ...doc, value })
    }
  }
}
