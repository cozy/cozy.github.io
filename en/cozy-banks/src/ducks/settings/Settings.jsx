/* global __TARGET__, __APP_VERSION__ */
import React from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import AppVersion from 'ducks/settings/AppVersion'
import BarTheme from 'ducks/bar/BarTheme'
import Padded from 'components/Padded'
import styles from 'ducks/settings/Settings.styl'
import LegalMention from 'ducks/legal/LegalMention'
import TabsHeader from 'ducks/settings/TabsHeader'

const Settings = ({ children }) => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <BarTheme theme="primary" />
      <TabsHeader />

      <Padded className={styles.Settings__Content}>
        <LegalMention className={isMobile ? 'u-mb-half ' : 'u-mt-1'} />
        {children}
      </Padded>
      {__TARGET__ === 'mobile' && (
        <Padded>
          <AppVersion version={__APP_VERSION__} />
        </Padded>
      )}
    </>
  )
}

export default Settings
