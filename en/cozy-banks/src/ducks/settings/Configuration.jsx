import React from 'react'
import { translate } from 'cozy-ui/react'
import { isCollectionLoading, hasBeenLoaded } from 'ducks/client/utils'
import { queryConnect, withMutations } from 'cozy-client'
import { settingsConn, accountsConn } from 'doctypes'
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
  onChangeValue = key => value => {
    const { settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    set(settings, [...key.split('.'), 'value'], value)
    this.saveDocument(settings, {
      updateCollections: ['settings']
    })
  }

  onDelayedDebitAccountsChange = async changes => {
    if (
      changes.previousCreditCard &&
      changes.previousCreditCard !== changes.newCreditCard
    ) {
      changes.previousCreditCard.checkingsAccount.unset()
      await this.saveDocument(changes.previousCreditCard)
    }

    changes.newCreditCard.checkingsAccount.set(changes.newCheckings)
    await this.saveDocument(changes.newCreditCard)
  }

  render() {
    const { t, settingsCollection, accountsCollection } = this.props

    if (
      (isCollectionLoading(settingsCollection) &&
        !hasBeenLoaded(settingsCollection)) ||
      (isCollectionLoading(accountsCollection) &&
        !hasBeenLoaded(accountsCollection))
    ) {
      return <Loading />
    }

    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    const accounts = accountsCollection.data

    return (
      <div>
        <TogglePane>
          <TogglePaneTitle>{t('Notifications.title')}</TogglePaneTitle>
          <TogglePaneText>{t('Notifications.description')}</TogglePaneText>
          <ToggleRow
            title={t('Notifications.if_balance_lower.settingTitle')}
            description={t('Notifications.if_balance_lower.description')}
            onToggle={this.onToggle('notifications.balanceLower')}
            onChangeValue={this.onChangeValue('notifications.balanceLower')}
            enabled={settings.notifications.balanceLower.enabled}
            value={settings.notifications.balanceLower.value}
            name="balanceLower"
            unit="€"
          />
          {flag('delayed-debit-alert') && (
            <DelayedDebitAlert
              accounts={accounts}
              onToggle={this.onToggle('notifications.delayedDebit')}
              onChangeValue={this.onChangeValue('notifications.delayedDebit')}
              onAccountsChange={this.onDelayedDebitAccountsChange}
              {...settings.notifications.delayedDebit}
            />
          )}
          <ToggleRow
            title={t('Notifications.if_transaction_greater.settingTitle')}
            description={t('Notifications.if_transaction_greater.description')}
            onToggle={this.onToggle('notifications.transactionGreater')}
            onChangeValue={this.onChangeValue(
              'notifications.transactionGreater'
            )}
            enabled={settings.notifications.transactionGreater.enabled}
            value={settings.notifications.transactionGreater.value}
            name="transactionGreater"
            unit="€"
          />
          <CategoryAlertSettingsPane />
          <ToggleRowWrapper>
            <ToggleRowTitle>
              {t('Notifications.health_section.title')}
            </ToggleRowTitle>
            <ToggleRowDescription>
              {t('Notifications.health_section.description')}
            </ToggleRowDescription>
            <div className="u-pl-2 u-pt-1-half">
              <ToggleRow
                title={t('Notifications.when_health_bill_linked.settingTitle')}
                description={t(
                  'Notifications.when_health_bill_linked.description'
                )}
                onToggle={this.onToggle('notifications.healthBillLinked')}
                enabled={settings.notifications.healthBillLinked.enabled}
                name="healthBillLinked"
              />
              <ToggleRow
                title={t(
                  'Notifications.when_late_health_reimbursement.settingTitle'
                )}
                description={t(
                  'Notifications.when_late_health_reimbursement.description'
                )}
                onToggle={this.onToggle(
                  'notifications.lateHealthReimbursement'
                )}
                onChangeValue={this.onChangeValue(
                  'notifications.lateHealthReimbursement'
                )}
                enabled={settings.notifications.lateHealthReimbursement.enabled}
                value={settings.notifications.lateHealthReimbursement.value}
                name="lateHealthReimbursement"
                unit={t('Notifications.when_late_health_reimbursement.unit')}
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
    settingsCollection: settingsConn,
    accountsCollection: accountsConn
  }),
  flag.connect,
  translate()
)(Configuration)
