// TODO Move this to Harvest

import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react'
import Infos from 'cozy-ui/transpiled/react/Infos'
import { getErrorLocaleBound, KonnectorJobError } from 'cozy-harvest-lib'
import ReconnectTriggerButton from 'ducks/transactions/TransactionPageErrors/ReconnectTriggerButton'

const TriggerErrorCard = ({ index, count, error, className }) => {
  const { t, lang } = useI18n()

  const { bankName, trigger } = error

  const konnError = new KonnectorJobError(trigger.current_state.last_error)
  // We do not have a full konnector object here but we can create a simple
  // one, that is sufficient for getErrorLocaleBound, from the information in
  // the trigger
  const konnector = {
    slug: trigger.message.slug,
    name: bankName
  }

  const errorTitle = getErrorLocaleBound(konnError, konnector, lang, 'title')

  return (
    <Infos
      className={'u-bdrs-0 u-maw-none u-p-1-half ' + (className || '')}
      actionButton={<ReconnectTriggerButton trigger={trigger} />}
      title={errorTitle + (count > 1 ? ` (${index + 1}/${count})` : '')}
      text={
        <div>{t('Transactions.trigger-error.description', { bankName })}</div>
      }
      icon="warning"
      isImportant
    />
  )
}

export const DumbTriggerErrorCard = TriggerErrorCard

export default TriggerErrorCard
