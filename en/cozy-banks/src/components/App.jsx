import React, { useEffect } from 'react'

import flag from 'cozy-flags'
import { queryConnect } from 'cozy-client'
import { withRouter } from 'react-router'
import compose from 'lodash/flowRight'
import CozyDevTools from 'cozy-client/dist/devtools'

import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { Content, Layout, Main } from 'cozy-ui/transpiled/react/Layout'
import UISidebar from 'cozy-ui/transpiled/react/Sidebar'

import { settingsConn } from 'doctypes'

import Nav from 'ducks/commons/Nav'
import { Warnings } from 'ducks/warnings'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import { pinGuarded } from 'ducks/pin'

import ErrorBoundary from 'components/ErrorBoundary'
import ReactHint from 'components/ReactHint'
import RouterContext from 'components/RouterContext'
import AppSearchBar from 'components/AppSearchBar'
import useKeyboardState from 'components/useKeyboardState'

import banksPanels from 'ducks/devtools/banksPanels'

import styles from './App.styl'

const KeyboardAwareSidebar = ({ children }) => {
  const showing = useKeyboardState()
  return showing ? null : <UISidebar>{children}</UISidebar>
}

const App = props => {
  const { showBottomNav, settingsCollection } = props
  const settings = getDefaultedSettingsFromCollection(settingsCollection)
  useEffect(() => {
    flag('local-model-override', settings.community.localModelOverride.enabled)
  }, [settings.community.localModelOverride.enabled])

  return (
    <RouterContext.Provider value={props.router}>
      <AppSearchBar />
      <Layout>
        {showBottomNav && (
          <KeyboardAwareSidebar>
            <Nav />
          </KeyboardAwareSidebar>
        )}

        <Main>
          <Content className={styles.Main}>
            <ErrorBoundary>{props.children}</ErrorBoundary>
          </Content>
        </Main>

        {/* Outside every other component to bypass overflow:hidden */}
        <ReactHint />

        <Warnings />
        <Alerter />
      </Layout>
      {flag('debug') ? <CozyDevTools panels={banksPanels} /> : null}
    </RouterContext.Provider>
  )
}

App.defaultProps = {
  showBottomNav: true
}

export default compose(
  pinGuarded({
    timeout: flag('pin.debug') ? 10 * 1000 : undefined,
    showTimeout: flag('pin.debug')
  }),
  queryConnect({ settingsCollection: settingsConn }),
  withRouter
)(App)
