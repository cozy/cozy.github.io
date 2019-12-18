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
    value: 'Notifications.if_balance_lower.fieldLabels.value',
    accountOrGroup: 'Notifications.if_balance_lower.fieldLabels.accountOrGroup'
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
    value: 'Notifications.if_transaction_greater.fieldLabels.value',
    accountOrGroup:
      'Notifications.if_transaction_greater.fieldLabels.accountOrGroup'
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
        unitKey: 'Notifications.when_late_health_reimbursement.unit'
      }
    }
  },
  fieldOrder: ['value'],
  fieldLabels: {
    value: 'Notifications.when_late_health_reimbursement.fieldLabels.value'
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
