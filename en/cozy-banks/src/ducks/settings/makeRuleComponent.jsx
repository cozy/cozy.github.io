import React from 'react'
import PropTypes from 'prop-types'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'

import { makeEditionModalFromSpec } from 'components/EditionModal'
import Rules from 'ducks/settings/Rules'
import { trackEvent, getPageLastPart } from 'ducks/tracking/browser'
import EditableSettingCard from './EditableSettingCard'
import { ensureNewRuleFormat } from './ruleUtils'

const makeRuleComponent = ({
  getRuleDescriptionProps,
  getRuleDescriptionKey,
  getNewRule,
  getInitialRules,
  spec,
  displayName,
  shouldOpenOnToggle,
  trackPageName
}) => {
  const EditionModal = makeEditionModalFromSpec(spec)

  const RulesComponent = props => {
    const { t } = useI18n()

    let {
      rules: rawInitialRules,
      getAccountOrGroupLabel,
      onChangeRules,
      ruleProps
    } = props

    const initialRules = ensureNewRuleFormat(rawInitialRules)
    const onError = err => {
      // eslint-disable-next-line no-console
      console.warn('Could not save rule')
      // eslint-disable-next-line no-console
      console.error(err)
      Alerter.error(t('Settings.rules.saving-error'))
    }

    return (
      <Rules
        rules={initialRules}
        onUpdate={onChangeRules}
        onError={onError}
        addButtonLabelKey="Settings.rules.create"
        makeNewItem={getNewRule}
        ItemEditionModal={EditionModal}
        trackPageName={trackPageName}
      >
        {(rule, i, createOrUpdateRule, removeRule) => (
          <EditableSettingCard
            doc={rule}
            key={i}
            onToggle={enabled => {
              createOrUpdateRule({ ...rule, enabled })
              trackEvent({
                name: `${getPageLastPart(trackPageName)}-${
                  enabled ? 'on' : 'off'
                }`
              })
            }}
            removeModalTitle={t('Settings.rules.remove-modal.title')}
            removeModalDescription={t('Settings.rules.remove-modal.desc')}
            onChangeDoc={createOrUpdateRule}
            onRemoveDoc={removeRule}
            canBeRemoved={initialRules.length > 1}
            editModalProps={spec}
            getAccountOrGroupLabel={getAccountOrGroupLabel}
            descriptionKey={getRuleDescriptionKey}
            descriptionProps={getRuleDescriptionProps}
            shouldOpenOnToggle={shouldOpenOnToggle}
            ruleProps={ruleProps}
            trackPageName={trackPageName}
          />
        )}
      </Rules>
    )
  }
  RulesComponent.defaultProps = {
    rules: getInitialRules()
  }

  RulesComponent.propTypes = {
    rules: PropTypes.array.isRequired,
    onChangeRules: PropTypes.func.isRequired
  }

  RulesComponent.displayName = displayName

  return RulesComponent
}

export default makeRuleComponent
