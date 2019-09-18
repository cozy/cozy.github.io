import React from 'react'
import ErrorCard from 'components/ErrorCard'
import { useRedirectionURL } from 'components/effects'
import { translate } from 'cozy-ui/transpiled/react'
import compose from 'lodash/flowRight'
import { withClient } from 'cozy-client'

const noBorderStyle = { borderRadius: 0 }

const TriggerErrorCard = ({ t, trigger, index, count, client, bankName }) => {
  const url = useRedirectionURL(client, 'io.cozy.accounts', {
    account: trigger.message.account,
    konnector: trigger.message.konnector
  })
  return (
    <ErrorCard
      style={noBorderStyle}
      title={
        t('Transactions.trigger-error.title') +
        (count > 1 ? ` (${index + 1}/${count})` : '')
      }
      content={t('Transactions.trigger-error.description', { bankName })}
      buttonLabel={t('Transactions.trigger-error.cta')}
      buttonHref={url}
      buttonTarget="_blank"
    />
  )
}

export default compose(
  withClient,
  translate()
)(TriggerErrorCard)
