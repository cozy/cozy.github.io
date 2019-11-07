import React, { useState } from 'react'
import compose from 'lodash/flowRight'
import maxBy from 'lodash/maxBy'
import { withClient, queryConnect } from 'cozy-client'
import { Button, Stack, Alerter, translate } from 'cozy-ui/transpiled/react'

import TogglePane, {
  TogglePaneTitle,
  TogglePaneText
} from 'ducks/settings/TogglePane'

import { settingsConn } from 'doctypes'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'

import CategoryAlertCard from 'ducks/settings/CategoryAlerts/CategoryAlertCard'
import CategoryAlertEditModal from 'ducks/settings/CategoryAlerts/CategoryAlertEditModal'

const makeNewAlert = () => ({
  categoryId: '400110',
  balanceThresholdMin: 100,
  accountOrGroup: null
})

const CreateCategoryAlert = translate()(({ createAlert, t, ...props }) => {
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const handleCreateAlert = async newAlert => {
    setCreating(false)
    try {
      setSaving(true)
      await createAlert(newAlert)
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <Button
        className="u-ml-0"
        theme="secondary"
        label={t('Settings.budget-category-alerts.create-alert')}
        busy={saving}
        onClick={() => {
          setCreating(true)
        }}
        {...props}
      />
      {creating ? (
        <CategoryAlertEditModal
          onDismiss={() => setCreating(false)}
          initialAlert={makeNewAlert()}
          onEditAlert={handleCreateAlert}
        />
      ) : null}
    </>
  )
})

const Grid = ({ children }) => <div>{children}</div>

/**
 * Replace item in arr, finding item through idFn.
 * If previous item cannot be found, the new item is pushed at the
 * end of the array.
 */
const replaceBy = (arr, item, idFn) => {
  const id = idFn(item)
  const index = arr.findIndex(x => idFn(x) === id)
  return index !== -1
    ? [...arr.slice(0, index), item, ...arr.slice(index + 1)]
    : [...arr, item]
}

const getAlertId = x => x.id

const getNextAlertId = alerts => {
  return alerts.length === 0 ? 0 : getAlertId(maxBy(alerts, getAlertId))
}

const CategoryAlertsPane = ({ client, settingsCollection, t }) => {
  const settings = getDefaultedSettingsFromCollection(settingsCollection)
  const [alerts, setAlerts] = useState(settings.categoryBudgetAlerts)

  const updateAlerts = async updatedAlerts => {
    const previousAlerts = alerts
    const updatedSettings = {
      ...settings,
      categoryBudgetAlerts: updatedAlerts
    }
    setAlerts(updatedAlerts)
    try {
      await client.save(updatedSettings)
    } catch (e) {
      Alerter.error(t('Settings.budget-category-alerts.saving-error'))
      setAlerts(previousAlerts)
    }
  }

  const createOrUpdateAlert = async updatedAlert => {
    if (!updatedAlert.id) {
      updatedAlert.id = getNextAlertId(alerts)
    }
    const updatedAlerts = replaceBy(alerts, updatedAlert, getAlertId)
    await updateAlerts(updatedAlerts)
  }

  const removeAlert = async alertToRemove => {
    const idToRemove = getAlertId(alertToRemove)
    const updatedAlerts = alerts.filter(
      alert => getAlertId(alert) !== idToRemove
    )
    await updateAlerts(updatedAlerts)
  }

  return (
    <TogglePane>
      <TogglePaneTitle>
        {t('Settings.budget-category-alerts.pane-title')}
      </TogglePaneTitle>
      <TogglePaneText>
        {t('Settings.budget-category-alerts.pane-description')}
      </TogglePaneText>
      <Stack spacing="s">
        <div>
          <Grid>
            {alerts
              ? alerts.map((alert, i) => (
                  <CategoryAlertCard
                    key={i}
                    updateAlert={createOrUpdateAlert}
                    removeAlert={removeAlert}
                    alert={alert}
                  />
                ))
              : null}
          </Grid>
        </div>
        <CreateCategoryAlert createAlert={createOrUpdateAlert} />
      </Stack>
    </TogglePane>
  )
}

export default compose(
  withClient,
  translate(),
  queryConnect({
    settingsCollection: settingsConn
  })
)(CategoryAlertsPane)
