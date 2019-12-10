import React from 'react'
import { translate } from 'cozy-ui/react'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { queryConnect, withMutations } from 'cozy-client'
import { settingsConn } from 'doctypes'
import { flowRight as compose, set } from 'lodash'
import Loading from 'components/Loading'

import flag from 'cozy-flags'

import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import PinSettings from 'ducks/settings/PinSettings'
import TogglePane, {
  TogglePaneTitle,
  TogglePaneSubtitle,
  TogglePaneText
} from 'ducks/settings/TogglePane'
import ToggleRow, {
  ToggleRowTitle,
  ToggleRowDescription,
  ToggleRowWrapper
} from 'ducks/settings/ToggleRow'
import DelayedDebitAlert from 'ducks/settings/DelayedDebitAlert'
import CategoryAlertSettingsPane from 'ducks/settings/CategoryAlerts/CategoryAlertSettingsPane'
import TogglableSettingCard from './TogglableSettingCard'
import { CHOOSING_TYPES } from 'components/EditionModal'

const getValueFromNotification = notification => notification.value
const updatedNotificationFromValue = (notification, value) => ({
  ...notification,
  value
})

const singleValueFieldOrder = ['value']

// i18n
const editModalProps = {
  balanceLower: ({ t, initialDoc }) => ({
    modalTitle: t('Notifications.editModal.title'),
    fieldSpecs: {
      value: {
        type: CHOOSING_TYPES.number,
        getValue: getValueFromNotification,
        updater: updatedNotificationFromValue,
        sectionProps: {
          unit: '€'
        }
      }
    },
    fieldOrder: singleValueFieldOrder,
    fieldLabels: {
      value: t('Notifications.if_balance_lower.fieldLabels.value')
    },
    initialDoc
  }),
  transactionGreater: ({ t, initialDoc }) => ({
    modalTitle: t('Notifications.editModal.title'),
    fieldSpecs: {
      value: {
        type: CHOOSING_TYPES.number,
        getValue: getValueFromNotification,
        updater: updatedNotificationFromValue,
        sectionProps: {
          unit: '€'
        }
      }
    },
    fieldOrder: singleValueFieldOrder,
    fieldLabels: {
      value: t('Notifications.if_transaction_greater.fieldLabels.value')
    },
    initialDoc
  }),
  lateHealthReimbursement: ({ t, initialDoc }) => ({
    modalTitle: t('Notifications.editModal.title'),
    fieldSpecs: {
      value: {
        type: CHOOSING_TYPES.number,
        getValue: getValueFromNotification,
        updater: updatedNotificationFromValue,
        sectionProps: {
          unit: t('Notifications.when_late_health_reimbursement.unit')
        }
      }
    },
    fieldOrder: singleValueFieldOrder,
    fieldLabels: {
      value: t('Notifications.when_late_health_reimbursement.fieldLabels.value')
    },
    initialDoc
  })
}

/**
 * Configure notifications and other features
 */
export class Configuration extends React.Component {
  saveDocument = async doc => {
    const { saveDocument } = this.props
    await saveDocument(doc)
    this.forceUpdate()
  }

  static renderExtraItems = () => null

  onToggle = key => checked => {
    const { settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    set(settings, [...key.split('.'), 'enabled'], checked)
    this.saveDocument(settings, {
      updateCollections: ['settings']
    })
  }

  onToggleFlag = key => checked => {
    flag(key, checked)
  }

  // TODO the displayed value and the persisted value should not be the same.
  // If the user empties the input, we may persist `0`, but we don't want to
  // show `0` until he blurs the input
  onChangeDoc = key => value => {
    const { settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    set(settings, [...key.split('.')], value)
    this.saveDocument(settings, {
      updateCollections: ['settings']
    })
  }

  render() {
    const { t, settingsCollection } = this.props

    if (
      isCollectionLoading(settingsCollection) &&
      !hasBeenLoaded(settingsCollection)
    ) {
      return <Loading />
    }

    const settings = getDefaultedSettingsFromCollection(settingsCollection)

    return (
      <div>
        <TogglePane>
          <TogglePaneTitle>{t('Notifications.title')}</TogglePaneTitle>
          <TogglePaneText>{t('Notifications.description')}</TogglePaneText>
          <TogglableSettingCard
            title={t('Notifications.if_balance_lower.settingTitle')}
            descriptionKey="Notifications.if_balance_lower.description"
            onToggle={this.onToggle('notifications.balanceLower')}
            onChangeDoc={this.onChangeDoc('notifications.balanceLower')}
            enabled={settings.notifications.balanceLower.enabled}
            value={settings.notifications.balanceLower.value}
            unit="€"
            editModalProps={editModalProps.balanceLower({
              t,
              initialDoc: settings.notifications.balanceLower
            })}
          />
          <TogglableSettingCard
            title={t('Notifications.if_transaction_greater.settingTitle')}
            descriptionKey="Notifications.if_transaction_greater.description"
            onToggle={this.onToggle('notifications.transactionGreater')}
            onChangeDoc={this.onChangeDoc('notifications.transactionGreater')}
            enabled={settings.notifications.transactionGreater.enabled}
            value={settings.notifications.transactionGreater.value}
            unit="€"
            editModalProps={editModalProps.transactionGreater({
              t,
              initialDoc: settings.notifications.transactionGreater
            })}
          />
          <CategoryAlertSettingsPane />
          <DelayedDebitAlert
            onToggle={this.onToggle('notifications.delayedDebit')}
            onChangeDoc={this.onChangeDoc('notifications.delayedDebit')}
            doc={settings.notifications.delayedDebit}
          />
          <ToggleRowWrapper>
            <ToggleRowTitle>
              {t('Notifications.health_section.title')}
            </ToggleRowTitle>
            <ToggleRowDescription>
              {t('Notifications.health_section.description')}
            </ToggleRowDescription>
            <div className="u-pl-2 u-pt-1-half">
              <TogglableSettingCard
                title={t('Notifications.when_health_bill_linked.settingTitle')}
                descriptionKey="Notifications.when_health_bill_linked.description"
                onToggle={this.onToggle('notifications.healthBillLinked')}
                enabled={settings.notifications.healthBillLinked.enabled}
              />
              <TogglableSettingCard
                title={t(
                  'Notifications.when_late_health_reimbursement.settingTitle'
                )}
                descriptionKey={
                  'Notifications.when_late_health_reimbursement.description'
                }
                onToggle={this.onToggle(
                  'notifications.lateHealthReimbursement'
                )}
                onChangeDoc={this.onChangeDoc(
                  'notifications.lateHealthReimbursement'
                )}
                enabled={settings.notifications.lateHealthReimbursement.enabled}
                value={settings.notifications.lateHealthReimbursement.value}
                editModalProps={editModalProps.lateHealthReimbursement({
                  t,
                  initialDoc: settings.notifications.lateHealthReimbursement
                })}
              />
            </div>
          </ToggleRowWrapper>
        </TogglePane>
        <TogglePane>
          <TogglePaneTitle>
            {t('AdvancedFeaturesSettings.title')}
          </TogglePaneTitle>
          <TogglePaneSubtitle>
            {t('AdvancedFeaturesSettings.automatic_categorization.title')}
          </TogglePaneSubtitle>
          <ToggleRow
            description={t(
              'AdvancedFeaturesSettings.automatic_categorization.local_model_override.description'
            )}
            onToggle={this.onToggle('community.localModelOverride')}
            enabled={settings.community.localModelOverride.enabled}
            name="localModelOverride"
          />
        </TogglePane>

        <TogglePane>
          <TogglePaneTitle>{t('Settings.security.title')}</TogglePaneTitle>
          {flag('pin') && <PinSettings />}
          <ToggleRow
            title={t('Settings.security.amount_blur.title')}
            description={t('Settings.security.amount_blur.description')}
            onToggle={this.onToggleFlag('amount_blur')}
            enabled={Boolean(flag('amount_blur'))}
            name="amountBlur"
          />
        </TogglePane>

        {Configuration.renderExtraItems()}
      </div>
    )
  }
}

export default compose(
  withMutations(),
  queryConnect({
    settingsCollection: settingsConn
  }),
  flag.connect,
  translate()
)(Configuration)
