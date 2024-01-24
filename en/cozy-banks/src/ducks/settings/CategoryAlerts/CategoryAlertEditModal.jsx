import React from 'react'
import PropTypes from 'prop-types'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { useTrackPage } from 'ducks/tracking/browser'
import EditionModal from 'components/EditionModal'
import { categoryBudgets } from '../specs'

/**
 * Modal to edit a category alert
 *
 * - Edit category
 * - Edit threshold for the alert
 * - Edit account/group for the alert
 */
const CategoryAlertEditModal = ({ initialDoc, onEdit, onDismiss }) => {
  const { t } = useI18n()
  useTrackPage('parametres:configuration:alerte-budget')
  const modalTitle = categoryBudgets.modalTitle
  const okButtonLabel = doc =>
    doc.id !== undefined
      ? t('Settings.budget-category-alerts.edit.update-ok')
      : t('Settings.budget-category-alerts.edit.create-ok')

  const cancelButtonLabel = () =>
    t('Settings.budget-category-alerts.edit.cancel')
  return (
    <EditionModal
      initialDoc={initialDoc}
      onEdit={onEdit}
      fieldSpecs={categoryBudgets.fieldSpecs}
      fieldOrder={categoryBudgets.fieldOrder}
      fieldLabels={categoryBudgets.fieldLabels}
      onDismiss={onDismiss}
      okButtonLabel={okButtonLabel}
      cancelButtonLabel={cancelButtonLabel}
      modalTitle={modalTitle}
    />
  )
}

CategoryAlertEditModal.propTypes = {
  initialDoc: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired
}

export default CategoryAlertEditModal
