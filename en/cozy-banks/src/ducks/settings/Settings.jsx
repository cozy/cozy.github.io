/* global __TARGET__, __APP_VERSION__ */
import React from 'react'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import AppVersion from 'ducks/settings/AppVersion'
import BarTheme from 'ducks/bar/BarTheme'
import Padded from 'components/Padded'
import styles from 'ducks/settings/Settings.styl'
import LegalMention from 'ducks/legal/LegalMention'
import TabsHeader from 'ducks/settings/TabsHeader'
import Delayed from 'components/Delayed'

const Settings = ({ children, delayContent }) => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <BarTheme theme="primary" />
      <TabsHeader />

      <Delayed delay={delayContent}>
        <Padded className={styles.Settings__Content}>
          <LegalMention className={isMobile ? 'u-mb-half ' : 'u-mt-1'} />
          {children}
        </Padded>
      </Delayed>
      {__TARGET__ === 'mobile' && (
        <Padded>
          <AppVersion version={__APP_VERSION__} />
        </Padded>
      )}
    </>
  )
}

Settings.defaultProps = {
  delayContent: 0
}

export default Settings
