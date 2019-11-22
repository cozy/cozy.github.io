import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Card, Icon, translate, Modal } from 'cozy-ui/transpiled/react'

import { CategoryIcon, getCategoryName } from 'ducks/categories'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import AccountOrGroupLabel from 'ducks/settings/CategoryAlerts/AccountOrGroupLabel'
import { ACCOUNT_DOCTYPE } from 'doctypes'

import styles from './CategoryAlertCard.styl'
import flag from 'cozy-flags'

const CategoryAlertPropType = PropTypes.shape({
  categoryId: PropTypes.string.isRequired,
  maxThreshold: PropTypes.number.isRequired
})

const CategoryAlertDebug = ({ alert }) => (
  <>
    <hr />
    alert id: {alert.id}
    <br />
    last notification date: {alert.lastNotificationDate}
    <br />
    last notification amount: {alert.lastNotificationAmount}
    <br />
    category id: {alert.categoryId}
  </>
)

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
      <Card className={styles.CategoryAlertCard} onClick={handleCardClick}>
        <div className="u-media u-media-top">
          <div className="u-media-fixed u-mr-1">
            <CategoryIcon categoryId={alert.categoryId} />
          </div>
          <div className="u-media-grow">
            {t('Settings.budget-category-alerts.budget-inferior-to', {
              threshold: alert.maxThreshold
            })}
            {saving ? <Spinner size="small" /> : null}
            <br />
            {t('Settings.budget-category-alerts.for-category', {
              categoryName: t(
                `Data.${
                  alert.categoryIsParent ? 'categories' : 'subcategories'
                }.${categoryName}`
              )
            })}
            <br />
            {alert.accountOrGroup ? (
              <>
                {t(
                  alert.accountOrGroup._type === ACCOUNT_DOCTYPE
                    ? 'Settings.budget-category-alerts.for-account'
                    : 'Settings.budget-category-alerts.for-groups',
                  {
                    threshold: alert.maxThreshold
                  }
                )}{' '}
                <AccountOrGroupLabel doc={alert.accountOrGroup} />
              </>
            ) : (
              t('Settings.budget-category-alerts.for-all-accounts')
            )}
            {flag('budget-alerts.debug') ? (
              <CategoryAlertDebug alert={alert} />
            ) : null}
          </div>
          <div className="u-media-fixed u-ml-1">
            <span
              onClick={handleRequestRemoval}
              className="u-expanded-click-area"
            >
              <Icon color="var(--coolGrey)" icon="cross" />
            </span>
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
