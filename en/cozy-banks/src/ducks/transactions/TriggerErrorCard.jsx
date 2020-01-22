// TODO Move this to Harvest

import React from 'react'
import { useRedirectionURL } from 'components/effects'
import { useI18n, translate } from 'cozy-ui/transpiled/react'
import compose from 'lodash/flowRight'
import { withClient } from 'cozy-client'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Infos from 'cozy-ui/transpiled/react/Infos'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import { getErrorLocaleBound, KonnectorJobError } from 'cozy-harvest-lib'

const TriggerErrorCard = ({
  lang,
  trigger,
  index,
  count,
  client,
  bankName,
  breakpoints,
  className
}) => {
  const { t } = useI18n()
  const url = useRedirectionURL(client, 'io.cozy.accounts', {
    account: trigger.message.account,
    konnector: trigger.message.konnector
  })

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
      actionButton={
        <ButtonLink
          theme="secondary"
          extension={breakpoints.isMobile ? 'full' : 'narrow'}
          className="u-mh-0"
          label={t('Transactions.trigger-error.cta')}
          icon="openwith"
          href={url}
        />
      }
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

export default compose(
  translate(),
  withClient,
  withBreakpoints()
)(TriggerErrorCard)
