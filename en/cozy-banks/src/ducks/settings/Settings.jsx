/* global __TARGET__, __APP_VERSION__ */
import React from 'react'
import { withBreakpoints, useI18n } from 'cozy-ui/transpiled/react'
import {
  Tabs,
  TabPanels,
  TabPanel,
  TabList,
  Tab
} from 'cozy-ui/transpiled/react/Tabs'
import styles from 'ducks/settings/Settings.styl'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'
import AppVersion from 'ducks/settings/AppVersion'
import { PageTitle } from 'components/Title'
import { Padded } from 'components/Spacing'
import BarTheme from 'ducks/bar/BarTheme'
import cx from 'classnames'
import flag from 'cozy-flags'

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
  const tabs = tabNames.map(tabName => (
    <Tab key={tabName} name={tabName} onClick={goTo(`/settings/${tabName}`)}>
      {t(`Settings.${tabName}`)}
    </Tab>
  ))

  return (
    <React.Fragment>
      <BarTheme theme="primary" />
      <Padded className={cx({ ['u-p-0']: isMobile })}>
        <PageTitle color={isMobile ? 'primary' : null}>
          {t('Settings.title')}
        </PageTitle>
      </Padded>
      <Tabs className={styles['bnk-tabs']} initialActiveTab={defaultTab}>
        <TabList inverted={isMobile} className={styles['bnk-coz-tab-list']}>
          {tabs}
        </TabList>
        <TabPanels className={styles.TabPanels}>
          <TabPanel active>
            <Padded>{children}</Padded>
          </TabPanel>
        </TabPanels>
      </Tabs>
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
