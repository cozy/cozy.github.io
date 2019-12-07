import React from 'react'
import { translate } from 'cozy-ui/react'
import EditionModal, { CHOOSING_TYPES } from 'components/EditionModal'
import {
  getAccountOrGroupChoiceFromAlert,
  getCategoryChoiceFromAlert,
  getMaxThresholdChoiceFromAlert,
  updatedAlertFromAccountOrGroupChoice,
  updatedAlertFromCategoryChoice,
  updatedAlertFromMaxThresholdChoice
} from './helpers'

const fieldSpecs = {
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
    updater: updatedAlertFromMaxThresholdChoice,
    immediate: true
  }
}

/**
 * Modal to edit a category alert
 *
 * - Edit category
 * - Edit threshold for the alert
 * - Edit account/group for the alert
 */
const CategoryAlertEditModal = translate()(
  ({ initialAlert, onEditAlert, onDismiss, t }) => {
    const modalTitle = t('Settings.budget-category-alerts.edit.modal-title')
    const okButtonLabel = doc =>
      doc.id !== undefined
        ? t('Settings.budget-category-alerts.edit.update-ok')
        : t('Settings.budget-category-alerts.edit.create-ok')

    const cancelButtonLabel = () =>
      t('Settings.budget-category-alerts.edit.cancel')
    return (
      <EditionModal
        initialDoc={initialAlert}
        onEdit={onEditAlert}
        fieldSpecs={fieldSpecs}
        fieldOrder={['accountOrGroup', 'category', 'maxThreshold']}
        fieldLabels={{
          accountOrGroup: t(
            'Settings.budget-category-alerts.edit.account-group-label'
          ),
          category: t('Settings.budget-category-alerts.edit.category-label'),
          maxThreshold: t(
            'Settings.budget-category-alerts.edit.threshold-label'
          )
        }}
        onDismiss={onDismiss}
        okButtonLabel={okButtonLabel}
        cancelButtonLabel={cancelButtonLabel}
        modalTitle={modalTitle}
      />
    )
  }
)

export default CategoryAlertEditModal
