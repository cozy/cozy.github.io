import React, { useCallback } from 'react'
import { useClient, useQuery } from 'cozy-client'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { settingsConn } from 'doctypes'

import { SubSection } from 'ducks/settings/Sections'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import CategoryAlertCard from 'ducks/settings/CategoryAlerts/CategoryAlertCard'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'
import { makeNewAlert } from 'ducks/budgetAlerts'

import Rules from '../Rules'

const updateBudgetAlerts = async (client, settings, categoryBudgetAlerts) => {
  const updatedSettings = {
    ...settings,
    categoryBudgetAlerts
  }
  await client.save(updatedSettings)
}

const CategoryAlertsPane = () => {
  const { t } = useI18n()
  const client = useClient()
  const settingsCollection = useQuery(settingsConn.query, settingsConn)
  const settings = getDefaultedSettingsFromCollection(settingsCollection)
  const onUpdateError = useCallback(
    () => Alerter.error(t('Settings.rules.saving-error')),
    [t]
  )
  const onUpdate = useCallback(
    updatedAlerts => updateBudgetAlerts(client, settings, updatedAlerts),
    [client, settings]
  )
  return (
    <SubSection
      title={t('Settings.budget-category-alerts.pane-title')}
      description={t('Settings.budget-category-alerts.pane-description')}
    >
      <Rules
        rules={settings.categoryBudgetAlerts}
        onUpdate={onUpdate}
        onError={onUpdateError}
        addButtonLabelKey="Settings.rules.create"
        makeNewItem={makeNewAlert}
        ItemEditionModal={CategoryAlertEditModal}
        trackPageName="alerte-budget"
      >
        {(alert, i, createOrUpdateAlert, removeAlert) => (
          <div key={i}>
            <CategoryAlertCard
              updateAlert={createOrUpdateAlert}
              removeAlert={removeAlert}
              alert={alert}
            />
          </div>
        )}
      </Rules>
    </SubSection>
  )
}

export default CategoryAlertsPane
