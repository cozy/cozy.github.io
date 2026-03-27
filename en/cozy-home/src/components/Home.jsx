import cx from 'classnames'
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { getFlagshipMetadata } from 'cozy-device-helper'
import flag from 'cozy-flags'
import { CozyConfirmDialogProvider } from 'cozy-harvest-lib'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from './styles.styl'

import { Announcements } from '@/components/Announcements/Announcements'
import Applications from '@/components/Applications'
import ApplicationsAndServices from '@/components/ApplicationsAndServices'
import { AssistantDesktopWrapper } from '@/components/Assistant/AssistantDesktopWrapper'
import GroupedServices from '@/components/GroupedServices'
import ScrollToTopOnMount from '@/components/ScrollToTopOnMount'
import Services from '@/components/Services'
import Shortcuts from '@/components/Shortcuts'

const Home = ({ wrapper }) => {
  const { pathname } = useLocation()
  const { isMobile } = useBreakpoints()

  return (
    <CozyConfirmDialogProvider>
      <main className="u-flex-grow-1">
        <ScrollToTopOnMount target={wrapper} />
        {pathname === '/connected' && <Announcements />}
        {flag('cozy.searchbar.enabled') && !isMobile && (
          <AssistantDesktopWrapper />
        )}
        <div
          role="main"
          className={cx('u-flex u-flex-column u-ph-1', {
            [styles['homeMainContent--withAssistant']]:
              isMobile && flag('cozy.searchbar.enabled'),
            [styles['homeMainContent--immersive']]:
              getFlagshipMetadata().immersive
          })}
        >
          {flag('home.apps.only-one-list') ? (
            <ApplicationsAndServices />
          ) : (
            <>
              <Applications />
              <Shortcuts />
              {flag('home.detailed-services-dev') ? (
                <GroupedServices />
              ) : (
                <Services />
              )}
            </>
          )}
        </div>
      </main>
      <Outlet />
    </CozyConfirmDialogProvider>
  )
}

export default Home
