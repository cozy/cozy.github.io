import React from 'react'
import { useRedirectionURL } from 'components/effects'
import { translate } from 'cozy-ui/transpiled/react'
import compose from 'lodash/flowRight'
import { withClient } from 'cozy-client'
import withBreakpoints from 'cozy-ui/transpiled/react/helpers/withBreakpoints'
import Infos from 'cozy-ui/transpiled/react/Infos'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'

const TriggerErrorCard = ({
  t,
  trigger,
  index,
  count,
  client,
  bankName,
  breakpoints
}) => {
  const url = useRedirectionURL(client, 'io.cozy.accounts', {
    account: trigger.message.account,
    konnector: trigger.message.konnector
  })
  return (
    <Infos
      className="u-bdrs-0 u-maw-none u-p-1-half"
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
      title={
        t('Transactions.trigger-error.title') +
        (count > 1 ? ` (${index + 1}/${count})` : '')
      }
      text={t('Transactions.trigger-error.description', { bankName })}
      icon="warning"
      isImportant
    />
  )
}

export default compose(
  withClient,
  translate(),
  withBreakpoints()
)(TriggerErrorCard)
