import React from 'react'
import compose from 'lodash/flowRight'
import { withClient, queryConnect } from 'cozy-client'
import { Alerter, useI18n } from 'cozy-ui/transpiled/react'

import { SubSection } from 'ducks/settings/Sections'

import { settingsConn } from 'doctypes'
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

const CategoryAlertsPane = ({ client, settingsCollection }) => {
  const { t } = useI18n()
  const settings = getDefaultedSettingsFromCollection(settingsCollection)
  const onUpdateError = () => Alerter.error(t('Settings.rules.saving-error'))
  const onUpdate = updatedAlerts =>
    updateBudgetAlerts(client, settings, updatedAlerts)
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

export default compose(
  withClient,
  queryConnect({
    settingsCollection: settingsConn
  })
)(CategoryAlertsPane)
