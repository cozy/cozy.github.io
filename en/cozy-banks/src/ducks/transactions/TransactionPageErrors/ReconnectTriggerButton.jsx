import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { ButtonLink } from 'cozy-ui/transpiled/react/deprecated/Button'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import HarvestBankAccountSettings from 'ducks/settings/HarvestBankAccountSettings'

const ReconnectTriggerButton = ({ trigger, label }) => {
  const { t } = useI18n()
  const [harvestConnectionId, setHarvestConnectionId] = useState()
  const handleClick = useCallback(() => {
    setHarvestConnectionId(trigger.message.account)
  }, [trigger])
  const { isMobile } = useBreakpoints()

  return (
    <>
      <ButtonLink
        theme="secondary"
        extension={isMobile ? 'full' : 'narrow'}
        className="u-mh-0"
        label={label || t('Transactions.trigger-error.cta')}
        onClick={handleClick}
      />
      {harvestConnectionId ? (
        <HarvestBankAccountSettings
          connectionId={harvestConnectionId}
          onDismiss={() => setHarvestConnectionId(null)}
        />
      ) : null}
    </>
  )
}

ReconnectTriggerButton.propTypes = {
  /** @type {io.cozy.triggers} The trigger that needs to be reconnected */
  trigger: PropTypes.object.isRequired,
  /** @type {Error} The error that needs to be solved */
  error: PropTypes.object.isRequired,
  /** @type {String} An alternative label for the button */
  label: PropTypes.string
}

export default ReconnectTriggerButton
