import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { CategoryIcon, getCategoryName } from 'ducks/categories'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { ACCOUNT_DOCTYPE } from 'doctypes'
import SettingCard from 'components/SettingCard'
import { withAccountOrGroupLabeller, markdownBold } from '../helpers'

import flag from 'cozy-flags'
import { SettingCardRemoveConfirmation } from 'ducks/settings/EditableSettingCard'

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
const CategoryAlertCard = ({
  removeAlert,
  updateAlert,
  alert,
  getAccountOrGroupLabel
}) => {
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCardClick = useCallback(
    ev => {
      if (ev.defaultPrevented) {
        return
      }
      setEditing(true)
    },
    [setEditing]
  )

  const handleEditAlert = useCallback(
    async updatedAlert => {
      setEditing(null)
      setSaving(true)
      try {
        await updateAlert(updatedAlert)
      } finally {
        setSaving(false)
      }
    },
    [updateAlert, setEditing, setSaving]
  )

  const handleRemoveAlert = useCallback(() => {
    setEditing(null)
    removeAlert(alert)
  }, [alert, removeAlert])

  const categoryName = t(
    `Data.${
      alert.categoryIsParent ? 'categories' : 'subcategories'
    }.${getCategoryName(alert.categoryId)}`
  )

  const accountOrGroupKey = alert.accountOrGroup
    ? alert.accountOrGroup._type === ACCOUNT_DOCTYPE
      ? 'Settings.budget-category-alerts.for-account'
      : 'Settings.budget-category-alerts.for-group'
    : null

  return (
    <>
      <SettingCard onClick={handleCardClick}>
        <div className="u-media u-media-top">
          <div className="u-media-fixed u-mr-1">
            <CategoryIcon categoryId={alert.categoryId} />
          </div>
          <div className="u-media-grow">
            {saving ? <Spinner size="small" /> : null}

            <span
              dangerouslySetInnerHTML={{
                __html: markdownBold(
                  t('Settings.budget-category-alerts.budget-inferior-to', {
                    threshold: alert.maxThreshold
                  })
                )
              }}
            />
            <br />
            <span
              dangerouslySetInnerHTML={{
                __html: markdownBold(
                  t('Settings.budget-category-alerts.for-category', {
                    categoryName: categoryName
                  })
                )
              }}
            />
            <br />
            {alert.accountOrGroup ? (
              <>
                <span
                  dangerouslySetInnerHTML={{
                    __html: markdownBold(
                      t(accountOrGroupKey, {
                        accountOrGroupLabel: getAccountOrGroupLabel(
                          alert.accountOrGroup
                        )
                      })
                    )
                  }}
                />
              </>
            ) : (
              t('Settings.budget-category-alerts.for-all-accounts')
            )}
            {flag('budget-alerts.debug') ? (
              <CategoryAlertDebug alert={alert} />
            ) : null}
          </div>
          <div className="u-media-fixed u-ml-1">
            <SettingCardRemoveConfirmation
              title={t('Settings.rules.remove-modal.title')}
              description={t('Settings.rules.remove-modal.desc')}
              onRemove={handleRemoveAlert}
            />
          </div>
        </div>
      </SettingCard>
      {editing ? (
        <CategoryAlertEditModal
          onDismiss={() => setEditing(null)}
          initialDoc={alert}
          onEdit={handleEditAlert}
        />
      ) : null}
    </>
  )
}

CategoryAlertCard.propTypes = {
  alert: CategoryAlertPropType
}

export default withAccountOrGroupLabeller('getAccountOrGroupLabel')(
  CategoryAlertCard
)
