/* global __TARGET__ */

import React from 'react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Button'

import {
  queryConnect,
  withClient,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import { settingsConn } from 'doctypes'
import { flowRight as compose, set } from 'lodash'
import Loading from 'components/Loading'

import flag from 'cozy-flags'

import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import PinSettings from 'ducks/settings/PinSettings'
import { Section, SubSection } from 'ducks/settings/Sections'

import DelayedDebitAlertRules from 'ducks/settings/DelayedDebitAlertRules'
import CategoryAlertSettingsPane from 'ducks/settings/CategoryAlerts/CategoryAlertSettingsPane'
import EditableSettingCard from './EditableSettingCard'
import { withAccountOrGroupLabeller } from './helpers'
import ToggleRow from 'ducks/settings/ToggleRow'
import BalanceLowerRules from './BalanceLowerRules'
import TransactionGreaterRules from './TransactionGreaterRules'

import { PersonalInfoModal } from 'ducks/personal-info'
import { lateHealthReimbursement } from './specs'

const onToggleFlag = key => checked => {
  flag(key, checked)
}

/**
 * Configure notifications and other features
 */
export class Configuration extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showPersonalInfoModal: false
    }
  }
  saveDocument = async doc => {
    const { client } = this.props
    await client.save(doc)
    this.forceUpdate()
  }

  static renderExtraItems = () => null

  onToggle = key => checked => {
    const { settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    set(settings, [...key.split('.'), 'enabled'], checked)
    this.saveDocument(settings)
  }

  // TODO the displayed value and the persisted value should not be the same.
  // If the user empties the input, we may persist `0`, but we don't want to
  // show `0` until he blurs the input
  onChangeDoc = key => value => {
    const { settingsCollection } = this.props
    const settings = getDefaultedSettingsFromCollection(settingsCollection)
    set(settings, [...key.split('.')], value)
    this.saveDocument(settings)
  }

  render() {
    const { t, settingsCollection } = this.props

    if (
      isQueryLoading(settingsCollection) &&
      !hasQueryBeenLoaded(settingsCollection)
    ) {
      return <Loading />
    }

    const settings = getDefaultedSettingsFromCollection(settingsCollection)

    return (
      <>
        <Section
          title={t('Notifications.title')}
          description={t('Notifications.description')}
        >
          <SubSection title={t('Notifications.if_balance_lower.settingTitle')}>
            <BalanceLowerRules
              rules={settings.notifications.balanceLower}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              onChangeRules={this.onChangeDoc('notifications.balanceLower')}
            />
          </SubSection>
          <SubSection
            title={t('Notifications.if_transaction_greater.settingTitle')}
          >
            <TransactionGreaterRules
              rules={settings.notifications.transactionGreater}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              onChangeRules={this.onChangeDoc(
                'notifications.transactionGreater'
              )}
            />
          </SubSection>
          <CategoryAlertSettingsPane />
          <SubSection
            title={t('Notifications.delayed_debit.settingTitle')}
            description={t('Notifications.delayed_debit.settingDescription')}
          >
            <DelayedDebitAlertRules
              onToggle={this.onToggle('notifications.delayedDebit')}
              onChangeRules={this.onChangeDoc('notifications.delayedDebit')}
              rules={settings.notifications.delayedDebit}
            />
          </SubSection>
          <SubSection
            title={t('Notifications.health_section.title')}
            description={t('Notifications.health_section.description')}
          >
            <div className="u-stack-xs">
              <EditableSettingCard
                title={t('Notifications.when_health_bill_linked.settingTitle')}
                descriptionKey="Notifications.when_health_bill_linked.description"
                onToggle={this.onToggle('notifications.healthBillLinked')}
                doc={settings.notifications.healthBillLinked}
              />
              <EditableSettingCard
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
                editModalProps={lateHealthReimbursement}
              />
            </div>
          </SubSection>
        </Section>
        <Section
          title={t('AdvancedFeaturesSettings.title')}
          description={t(
            'AdvancedFeaturesSettings.automatic_categorization.title'
          )}
        >
          <SubSection>
            <ToggleRow
              description={t(
                'AdvancedFeaturesSettings.automatic_categorization.local_model_override.description'
              )}
              onToggle={this.onToggle('community.localModelOverride')}
              enabled={settings.community.localModelOverride.enabled}
              name="localModelOverride"
            />
          </SubSection>
        </Section>

        <Section title={t('Settings.security.title')}>
          {__TARGET__ === 'mobile' ? <PinSettings /> : null}
          <SubSection title={t('Settings.security.amount_blur.title')}>
            <ToggleRow
              description={t('Settings.security.amount_blur.description')}
              onToggle={onToggleFlag('amount_blur')}
              enabled={Boolean(flag('amount_blur'))}
              name="amountBlur"
            />
          </SubSection>
        </Section>

        {flag('banks.transfers.need-personal-information') ? (
          <Section title={t('Settings.personal-info.title')}>
            <Button
              label={t('Settings.personal-info.edit')}
              onClick={() => this.setState({ showPersonalInfoModal: true })}
            />
            {this.state.showPersonalInfoModal ? (
              <PersonalInfoModal
                onSaveSuccessful={() => {
                  this.setState({ showPersonalInfoModal: false })
                }}
                wrapperProps={{
                  dismissAction: () =>
                    this.setState({ showPersonalInfoModal: false })
                }}
              />
            ) : null}
          </Section>
        ) : null}

        {Configuration.renderExtraItems()}
      </>
    )
  }
}

export default compose(
  withClient,
  queryConnect({
    settingsCollection: settingsConn
  }),
  withAccountOrGroupLabeller('getAccountOrGroupLabel'),
  flag.connect,
  translate()
)(Configuration)
