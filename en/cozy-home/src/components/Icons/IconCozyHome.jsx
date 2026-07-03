import React from 'react'

import { TwakeWorkplace } from '@linagora/twake-icons'
import { useClient } from 'cozy-client'
import AppIcon from 'cozy-ui-plus/dist/AppIcon'

const IconCozyHome = () => {
  const client = useClient()

  const fetchIcon = () => {
    return `${client.getStackClient().uri}/assets/images/icon-cozy-home.svg`
  }

  return (
    <AppIcon
      className="u-w-2 u-h-2 u-mr-half"
      fetchIcon={fetchIcon}
      fallbackIcon={TwakeWorkplace}
    />
  )
}

export default IconCozyHome
