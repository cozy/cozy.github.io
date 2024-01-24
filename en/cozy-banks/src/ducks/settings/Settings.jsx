import React from 'react'
import { Outlet } from 'react-router-dom'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import BarTheme from 'ducks/bar/BarTheme'
import Padded from 'components/Padded'
import styles from 'ducks/settings/Settings.styl'
import LegalMention from 'ducks/legal/LegalMention'
import TabsHeader from 'ducks/settings/TabsHeader'
import Delayed from 'components/Delayed'

const Settings = ({ delayContent }) => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <BarTheme theme="primary" />
      <TabsHeader />

      <Delayed delay={delayContent}>
        <Padded className={styles.Settings__Content}>
          <LegalMention className={isMobile ? 'u-mb-half ' : 'u-mt-1'} />
          <Outlet />
        </Padded>
      </Delayed>
    </>
  )
}

Settings.defaultProps = {
  delayContent: 0
}

export default Settings
