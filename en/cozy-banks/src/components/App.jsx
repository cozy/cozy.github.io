import React from 'react'
import ReactHintFactory from 'react-hint'
import 'react-hint/css/index.css'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { Layout, Main, Content } from 'cozy-ui/transpiled/react/Layout'
import Sidebar from 'cozy-ui/transpiled/react/Sidebar'
import Nav from 'ducks/commons/Nav'
import { Warnings } from 'ducks/warnings'
import flag from 'cozy-flags'
import { settingsConn } from 'doctypes'
import { queryConnect } from 'cozy-client'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import ErrorBoundary, { Error } from 'components/ErrorBoundary'
import { withRouter } from 'react-router'
import { flowRight as compose } from 'lodash'
import { hasParameter } from 'utils/qs'
import { pinGuarded } from 'ducks/pin'
import styles from './App.styl'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

const ReactHint = ReactHintFactory(React)

const App = props => {
  const settings = getDefaultedSettingsFromCollection(props.settingsCollection)
  flag('local-model-override', settings.community.localModelOverride.enabled)

  return (
    <BreakpointsProvider>
      <Layout>
        <Sidebar>
          <Nav />
        </Sidebar>

        <Main>
          <Content className={styles.Main}>
            {hasParameter(props.location.query, 'error') ? (
              <Error />
            ) : (
              <ErrorBoundary>{props.children}</ErrorBoundary>
            )}
          </Content>
        </Main>

        {/* Outside every other component to bypass overflow:hidden */}
        <ReactHint />

        <Warnings />
        <Alerter />
      </Layout>
    </BreakpointsProvider>
  )
}

export default compose(
  pinGuarded({
    timeout: flag('pin.debug') ? 10 * 1000 : undefined,
    showTimeout: flag('pin.debug')
  }),
  queryConnect({ settingsCollection: settingsConn }),
  withRouter
)(App)
