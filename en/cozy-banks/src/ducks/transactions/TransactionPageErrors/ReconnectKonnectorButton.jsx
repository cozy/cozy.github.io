import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import useRedirectionURL from 'components/useRedirectionURL'
import { useClient } from 'cozy-client'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

const ReconnectKonnectorButton = ({ account, konnector, label }) => {
  const { t } = useI18n()
  const client = useClient()
  const url = useRedirectionURL(client, 'io.cozy.accounts', {
    account: account,
    konnector: konnector
  })
  const breakpoints = useBreakpoints()

  return (
    <ButtonLink
      theme="secondary"
      extension={breakpoints.isMobile ? 'full' : 'narrow'}
      className="u-mh-0"
      label={label || t('Transactions.trigger-error.cta')}
      icon="openwith"
      href={url}
    />
  )
}

ReconnectKonnectorButton.propTypes = {
  account: PropTypes.string.isRequired,
  konnector: PropTypes.string.isRequired,
  label: PropTypes.string
}

export default ReconnectKonnectorButton
