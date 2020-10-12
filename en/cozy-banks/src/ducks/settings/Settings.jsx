/* global __TARGET__, __APP_VERSION__ */
import React from 'react'
import cx from 'classnames'

import flag from 'cozy-flags'
import { useI18n } from 'cozy-ui/transpiled/react'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { Tabs, TabList, Tab } from 'cozy-ui/transpiled/react/Tabs'

import AppVersion from 'ducks/settings/AppVersion'
import BarTheme from 'ducks/bar/BarTheme'

import { PageTitle } from 'components/Title'
import { Padded } from 'components/Spacing'
import Header from 'components/Header'
import tabsStyle from 'components/Tabs.styl'
import styles from 'ducks/settings/Settings.styl'

import { useHistory, useLocation } from 'components/RouterContext'

const Settings = ({ children }) => {
  const { t } = useI18n()
  const location = useLocation()
  const history = useHistory()
  const { isMobile } = useBreakpoints()

  const tabNames = ['configuration', 'accounts', 'groups']
  let defaultTab = location.pathname.replace('/settings/', '')
  if (tabNames.indexOf(defaultTab) === -1) defaultTab = 'configuration'

  const goTo = url => () => {
    history.push(url)
  }
  if (flag('debug')) {
    tabNames.push('debug')
  }
  const tabs = tabNames.map((tabName, i) => (
    <Tab
      className={i === 0 && !isMobile ? 'u-ml-2' : 0}
      key={tabName}
      name={tabName}
      onClick={goTo(`/settings/${tabName}`)}
    >
      {t(`Settings.${tabName}`)}
    </Tab>
  ))

  return (
    <React.Fragment>
      <BarTheme theme="primary" />
      <Padded className={cx({ ['u-p-0']: isMobile })}>
        <PageTitle>{t('Settings.title')}</PageTitle>
      </Padded>
      <Header fixed theme={isMobile ? 'inverted' : 'normal'}>
        <Tabs className={tabsStyle['Tabs']} initialActiveTab={defaultTab}>
          <TabList inverted={isMobile} className={tabsStyle['TabList']}>
            {tabs}
          </TabList>
        </Tabs>
      </Header>

      <Padded className={styles.Settings__Content}>{children}</Padded>
      {__TARGET__ === 'mobile' && (
        <Padded>
          <AppVersion version={__APP_VERSION__} />
        </Padded>
      )}
    </React.Fragment>
  )
}

export default flag.connect(Settings)
