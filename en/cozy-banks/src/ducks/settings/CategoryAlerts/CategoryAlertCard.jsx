import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Card, Icon, translate, Modal } from 'cozy-ui/transpiled/react'

import { CategoryIcon, getCategoryName } from 'ducks/categories'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import AccountOrGroupLabel from 'ducks/settings/CategoryAlerts/AccountOrGroupLabel'

const CategoryAlertPropType = PropTypes.shape({
  categoryId: PropTypes.string.isRequired,
  balanceThresholdMin: PropTypes.number.isRequired
})

/**
 * Shows informations on a category alert
 *
 * - Category name
 * - Category icon
 * - Balance threshold
 *
 * Displays edition modal and calls saveAlert callback
 * Displays removal button and calls removeAlert callback
 *
 */
const CategoryAlertCard = ({ removeAlert, updateAlert, alert, t }) => {
  const categoryName = getCategoryName(alert.categoryId)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingRemoval, setConfirmingRemoval] = useState(false)

  const handleCardClick = ev => {
    if (ev.defaultPrevented) {
      return
    }
    setEditing(true)
  }

  const handleEditAlert = async updatedAlert => {
    setEditing(null)
    setSaving(true)
    try {
      await updateAlert(updatedAlert)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAlert = () => {
    setEditing(null)
    removeAlert(alert)
    setConfirmingRemoval(false)
  }

  const handleRequestRemoval = ev => {
    ev.preventDefault()
    setConfirmingRemoval(true)
  }

  return (
    <>
      <Card
        style={{ display: 'inline-flex' }}
        className="u-c-pointer"
        onClick={handleCardClick}
      >
        <div className="u-media u-media-top">
          <div className="u-fixed u-mr-1">
            <CategoryIcon categoryId={alert.categoryId} />
          </div>
          <div className="u-grow">
            {t(`Data.subcategories.${categoryName}`)}
            {saving ? <Spinner size="small" /> : null}
            <br />
            {t('Settings.budget-category-alerts.budget-inferior-to', {
              threshold: alert.balanceThresholdMin
            })}
            <br />
            {alert.accountOrGroup ? (
              <AccountOrGroupLabel doc={alert.accountOrGroup} />
            ) : null}
          </div>
          <div className="u-fixed u-ml-1">
            <Icon
              color="var(--coolGrey)"
              icon="cross"
              onClick={handleRequestRemoval}
            />
          </div>
        </div>
      </Card>
      {editing ? (
        <CategoryAlertEditModal
          onDismiss={() => setEditing(null)}
          initialAlert={alert}
          onEditAlert={handleEditAlert}
          onRemoveAlert={handleRemoveAlert}
        />
      ) : null}
      {confirmingRemoval ? (
        <Modal
          primaryText={t('Settings.budget-category-alerts.remove.ok')}
          primaryType="danger"
          primaryAction={handleRemoveAlert}
          secondaryText={t('Settings.budget-category-alerts.remove.cancel')}
          secondaryAction={() => setConfirmingRemoval(false)}
          dismissAction={() => setConfirmingRemoval(false)}
          title={t('Settings.budget-category-alerts.remove.title')}
          description={t('Settings.budget-category-alerts.remove.desc')}
        />
      ) : null}
    </>
  )
}

CategoryAlertCard.propTypes = {
  alert: CategoryAlertPropType
}

export default translate()(CategoryAlertCard)
