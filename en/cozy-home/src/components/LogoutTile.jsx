import React, { useCallback } from 'react'

import { useClient } from 'cozy-client'
import { isFlagshipApp } from 'cozy-device-helper'
import { useWebviewIntent } from 'cozy-intent'
import Icon from 'cozy-ui/transpiled/react/Icon'
import LogoutLargeIcon from 'cozy-ui/transpiled/react/Icons/LogoutLarge'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import SquareAppIcon from 'cozy-ui-plus/dist/SquareAppIcon'
import { useI18n } from 'twake-i18n'

const LogoutTile = () => {
  const { t } = useI18n()
  const client = useClient()
  const webviewIntent = useWebviewIntent()

  const logout = useCallback(async () => {
    await client.logout()

    return isFlagshipApp() && webviewIntent
      ? webviewIntent.call('logout')
      : window.location.reload()
  }, [client, webviewIntent])

  const { isMobile } = useBreakpoints()

  return (
    <div onClick={logout} className="scale-hover u-c-pointer">
      <SquareAppIcon
        name={t('logout')}
        IconContent={<Icon icon={LogoutLargeIcon} size={isMobile ? 24 : 32} />}
      />
    </div>
  )
}

export default LogoutTile
