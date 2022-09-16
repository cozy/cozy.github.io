/* global __TARGET__ */

import React from 'react'
import { translate } from 'cozy-ui/transpiled/react/I18n'
import Button from 'cozy-ui/transpiled/react/Buttons'

import {
  queryConnect,
  withClient,
  isQueryLoading,
  hasQueryBeenLoaded
} from 'cozy-client'
import { settingsConn } from 'doctypes'
import set from 'lodash/set'
import compose from 'lodash/flowRight'
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
import BalanceGreaterRules from './BalanceGreaterRules'
import TransactionGreaterRules from './TransactionGreaterRules'

import { PersonalInfoDialog } from 'ducks/personal-info'
import { lateHealthReimbursement } from './specs'
import { trackPage, trackEvent } from 'ducks/tracking/browser'
import CategoryTagsSettings from 'ducks/settings/CategoryTags/CategoryTagsSettings'

const toggleToTrackEvents = {
  'community.localModelOverride': 'categorie_automatique'
}

/**
 * Configure notifications and other features
 */
export class Configuration extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showPersonalInfoDialog: false
    }
    this.handleToggleAmountBlur = this.handleToggleAmountBlur.bind(this)
    this.onToggleAmountCensoringInNotifications = this.onToggle(
      'notifications.amountCensoring'
    )

    this.onChangeBalanceLower = this.onChangeDoc('notifications.balanceLower')
    this.onChangeBalanceGreater = this.onChangeDoc(
      'notifications.balanceGreater'
    )
    this.onChangeTransactionGreater = this.onChangeDoc(
      'notifications.transactionGreater'
    )
    this.onChangeDelayedDebit = this.onChangeDoc('notifications.delayedDebit')
    this.onChangeLateHealthReimbursement = this.onChangeDoc(
      'notifications.lateHealthReimbursement'
    )

    this.onToggleDelayedDebit = this.onToggle('notifications.delayedDebit')
    this.onToggleHealthBillLinked = this.onToggle(
      'notifications.healthBillLinked'
    )
    this.onToggleLateHealthReimbursement = this.onToggle(
      'notifications.lateHealthReimbursement'
    )
    this.onToggleLocalModelOverride = this.onToggle(
      'community.localModelOverride'
    )
  }

  componentDidMount() {
    trackPage('parametres:configuration')
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

    if (toggleToTrackEvents[key]) {
      trackEvent({
        name: `${toggleToTrackEvents[key]}-${checked ? 'on' : 'off'}`
      })
    }
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

  handleToggleAmountBlur(checked) {
    flag('amount-blur', checked)
    trackEvent({
      name: `masquer_elements-${checked ? 'on' : 'off'}`
    })
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
          <SubSection title={t('Notifications.if-balance-lower.settingTitle')}>
            <BalanceLowerRules
              rules={settings.notifications.balanceLower}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              onChangeRules={this.onChangeBalanceLower}
            />
          </SubSection>
          <SubSection
            title={t('Notifications.if-balance-greater.settingTitle')}
          >
            <BalanceGreaterRules
              rules={settings.notifications.balanceGreater}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              onChangeRules={this.onChangeBalanceGreater}
            />
          </SubSection>
          <SubSection
            title={t('Notifications.if-transaction-greater.settingTitle')}
          >
            <TransactionGreaterRules
              rules={settings.notifications.transactionGreater}
              getAccountOrGroupLabel={this.props.getAccountOrGroupLabel}
              onChangeRules={this.onChangeTransactionGreater}
            />
          </SubSection>
          <CategoryAlertSettingsPane />
          {flag('banks.tags.enabled') && <CategoryTagsSettings />}
          <SubSection
            title={t('Notifications.delayed-debit.settingTitle')}
            description={t('Notifications.delayed-debit.settingDescription')}
          >
            <DelayedDebitAlertRules
              onToggle={this.onToggleDelayedDebit}
              onChangeRules={this.onChangeDelayedDebit}
              rules={settings.notifications.delayedDebit}
            />
          </SubSection>
          {flag('banks.health-reimbursements.deactivated') ? null : (
            <SubSection
              title={t('Notifications.health-section.title')}
              description={t('Notifications.health-section.description')}
            >
              <div className="u-stack-xs">
                <EditableSettingCard
                  title={t(
                    'Notifications.when-health-bill-linked.settingTitle'
                  )}
                  descriptionKey="Notifications.when-health-bill-linked.description"
                  onToggle={this.onToggleHealthBillLinked}
                  doc={settings.notifications.healthBillLinked}
                />
                <EditableSettingCard
                  title={t(
                    'Notifications.when-late-health-reimbursement.settingTitle'
                  )}
                  descriptionKey={
                    'Notifications.when-late-health-reimbursement.description'
                  }
                  onToggle={this.onToggleLateHealthReimbursement}
                  onChangeDoc={this.onChangeLateHealthReimbursement}
                  doc={settings.notifications.lateHealthReimbursement}
                  editModalProps={lateHealthReimbursement}
                />
              </div>
            </SubSection>
          )}
        </Section>
        <Section title={t('AdvancedFeaturesSettings.title')}>
          {__TARGET__ === 'mobile' ? <PinSettings /> : null}
          <SubSection title={t('Settings.security.title')}>
            <ToggleRow
              description={t('Settings.security.amount-blur.description')}
              onToggle={this.handleToggleAmountBlur}
              enabled={Boolean(flag('amount-blur'))}
              name="amountBlur"
            />
            <ToggleRow
              description={t(
                'Settings.security.amount-in-notifications-blur.description'
              )}
              onToggle={this.onToggleAmountCensoringInNotifications}
              enabled={settings.notifications.amountCensoring.enabled}
              name="amountInNotificationsBlur"
            />
          </SubSection>
          <SubSection
            title={t('AdvancedFeaturesSettings.automatic-categorization.title')}
          >
            <ToggleRow
              description={t(
                'AdvancedFeaturesSettings.automatic-categorization.local-model-override.description'
              )}
              onToggle={this.onToggleLocalModelOverride}
              enabled={settings.community.localModelOverride.enabled}
              name="localModelOverride"
            />
          </SubSection>
        </Section>

        {flag('banks.transfers.need-personal-information') ? (
          <Section title={t('Settings.personal-info.title')}>
            <Button
              label={t('Settings.personal-info.edit')}
              theme="contained"
              onClick={() => this.setState({ showPersonalInfoDialog: true })}
            />
            {this.state.showPersonalInfoDialog ? (
              <PersonalInfoDialog
                onSaveSuccessful={() => {
                  this.setState({ showPersonalInfoDialog: false })
                }}
                onClose={() => this.setState({ showPersonalInfoDialog: false })}
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
