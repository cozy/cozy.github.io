/* global __TARGET__, __APP_VERSION__ */
import React from 'react'
import { withBreakpoints, useI18n } from 'cozy-ui/transpiled/react'
import { Tabs, TabList, Tab } from 'cozy-ui/transpiled/react/Tabs'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'
import AppVersion from 'ducks/settings/AppVersion'
import { PageTitle } from 'components/Title'
import { Padded } from 'components/Spacing'
import BarTheme from 'ducks/bar/BarTheme'
import cx from 'classnames'
import flag from 'cozy-flags'
import tabsStyle from 'components/Tabs.styl'
import Header from 'components/Header'
import styles from './Settings.styl'

const Settings = ({ children, router, breakpoints: { isMobile } }) => {
  const { t } = useI18n()
  const tabNames = ['configuration', 'accounts', 'groups']
  let defaultTab = router.location.pathname.replace('/settings/', '')
  if (tabNames.indexOf(defaultTab) === -1) defaultTab = 'configuration'

  const goTo = url => () => {
    router.push(url)
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
      <Header fixed theme={isMobile ? 'primary' : null}>
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

export default compose(
  withRouter,
  flag.connect,
  withBreakpoints()
)(Settings)
