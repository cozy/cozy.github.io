import React from 'react'
import { translate, Alerter, Button } from 'cozy-ui/react'
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
import { withAccountOrGroupLabeller } from './helpers'
import { getDocumentIdentity } from 'ducks/client/utils'

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

const SettingSection = ({ children, title }) => (
  <ToggleRowWrapper>
    {title && <ToggleRowTitle>{title}</ToggleRowTitle>}
    {children}
  </ToggleRowWrapper>
)

const editModalProps = {
  balanceLower: ({ t }) => ({
    modalTitle: t('Notifications.editModal.title'),
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
    fieldOrder: [
      'value',
      flag('settings.notification-account-group') && 'accountOrGroup'
    ].filter(Boolean),
    fieldLabels: {
      value: t('Notifications.if_balance_lower.fieldLabels.value'),
      accountOrGroup: t(
        'Notifications.if_balance_lower.fieldLabels.accountOrGroup'
      )
    }
  }),
  transactionGreater: ({ t }) => ({
    modalTitle: t('Notifications.editModal.title'),
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
    fieldOrder: [
      'value',
      flag('settings.notification-account-group') && 'accountOrGroup'
    ].filter(Boolean),
    fieldLabels: {
      value: t('Notifications.if_transaction_greater.fieldLabels.value'),
      accountOrGroup: t(
        'Notifications.if_transaction_greater.fieldLabels.accountOrGroup'
      )
    }
  }),
  lateHealthReimbursement: ({ t }) => ({
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
    fieldOrder: ['value'],
    fieldLabels: {
      value: t('Notifications.when_late_health_reimbursement.fieldLabels.value')
    }
  })
}

// descriptionProps getters below need the full props to have access to
// `props.getAccountOrGroupLabel`.
// `getAccountOrGroupLabel` must come from the props to have access to the
// store since it needs to get the full accountOrGroup from the store, since
// the accountOrGroup from the notification is only its identity (only _id
// and _type).
// We pass the full props to descriptionKey to keep the symmetry between
// descriptionKey getter and descriptionProp getter
const getTransactionGreaterDescriptionKey = props => {
  if (props.doc && props.doc.accountOrGroup) {
    return 'Notifications.if_transaction_greater.descriptionWithAccountGroup'
  } else {
    return 'Notifications.if_transaction_greater.description'
  }
}

const getBalanceLowerDescriptionKey = props => {
  if (props.doc && props.doc.accountOrGroup) {
    return 'Notifications.if_balance_lower.descriptionWithAccountGroup'
  } else {
    return 'Notifications.if_balance_lower.description'
  }
}

const getTransactionGreaterDescriptionProps = props => ({
  accountOrGroupLabel: props.doc.accountOrGroup
    ? props.getAccountOrGroupLabel(props.doc.accountOrGroup)
    : null,
  value: props.doc.value
})

const getBalanceLowerDescriptionProps = props => ({
  accountOrGroupLabel: props.doc.accountOrGroup
    ? props.getAccountOrGroupLabel(props.doc.accountOrGroup)
    : null,
  value: props.doc.value
})

const onToggleFlag = key => checked => {
  flag(key, checked)
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
          <SettingSection
            title={t('Notifications.if_balance_lower.settingTitle')}
          >
            <TogglableSettingCard
              descriptionKey={getBalanceLowerDescriptionKey}
              descriptionProps={getBalanceLowerDescriptionProps}
              onToggle={this.onToggle('notifications.balanceLower')}
              onChangeDoc={this.onChangeDoc('notifications.balanceLower')}
              unit="€"
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              doc={settings.notifications.balanceLower}
              editModalProps={editModalProps.balanceLower({
                t
              })}
            />
            <Button
              className="u-ml-0"
              theme="subtle"
              icon="plus"
              label={t('Settings.create-alert')}
              onClick={() => {
                Alerter.success(t('ComingSoon.description'))
              }}
            />
          </SettingSection>
          <SettingSection
            title={t('Notifications.if_transaction_greater.settingTitle')}
          >
            <TogglableSettingCard
              descriptionKey={getTransactionGreaterDescriptionKey}
              descriptionProps={getTransactionGreaterDescriptionProps}
              onToggle={this.onToggle('notifications.transactionGreater')}
              onChangeDoc={this.onChangeDoc('notifications.transactionGreater')}
              doc={settings.notifications.transactionGreater}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              unit="€"
              editModalProps={editModalProps.transactionGreater({
                t
              })}
            />
            <Button
              className="u-ml-0"
              theme="subtle"
              icon="plus"
              label={t('Settings.create-alert')}
              onClick={() => {
                Alerter.success(t('ComingSoon.description'))
              }}
            />
          </SettingSection>
          <CategoryAlertSettingsPane />
          <DelayedDebitAlert
            onToggle={this.onToggle('notifications.delayedDebit')}
            onChangeDoc={this.onChangeDoc('notifications.delayedDebit')}
            doc={settings.notifications.delayedDebit}
          />
          <SettingSection title={t('Notifications.health_section.title')}>
            <ToggleRowDescription>
              {t('Notifications.health_section.description')}
            </ToggleRowDescription>
            <div className="u-pl-2 u-pt-1-half u-stack-xs">
              <TogglableSettingCard
                title={t('Notifications.when_health_bill_linked.settingTitle')}
                descriptionKey="Notifications.when_health_bill_linked.description"
                onToggle={this.onToggle('notifications.healthBillLinked')}
                doc={settings.notifications.healthBillLinked}
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
                doc={settings.notifications.lateHealthReimbursement}
                editModalProps={editModalProps.lateHealthReimbursement({
                  t
                })}
              />
            </div>
          </SettingSection>
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
            onToggle={onToggleFlag('amount_blur')}
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
  withAccountOrGroupLabeller('getAccountOrGroupLabel'),
  flag.connect,
  translate()
)(Configuration)
