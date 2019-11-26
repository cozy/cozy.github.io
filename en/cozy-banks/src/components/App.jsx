import React from 'react'
import ReactHintFactory from 'react-hint'
import 'react-hint/css/index.css'
import Alerter from 'cozy-ui/react/Alerter'
import { Layout, Main, Content } from 'cozy-ui/react/Layout'
import Sidebar from 'cozy-ui/react/Sidebar'
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

const ReactHint = ReactHintFactory(React)

const App = props => {
  const settings = getDefaultedSettingsFromCollection(props.settingsCollection)
  flag('local-model-override', settings.community.localModelOverride.enabled)
  flag(
    'reimbursements.late-health-limit',
    settings.notifications.lateHealthReimbursement.value
  )

  return (
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
  )
}

export default compose(
  // When removing the pin flag, do not forget to replace the exports (uncomment)
  // in ducks/pin/index.browser.jsx so that pin functionality is not included
  // in browsers
  flag('pin')
    ? pinGuarded({
        timeout: flag('pin.debug') ? 10 * 1000 : null,
        showTimeout: flag('pin.debug')
      })
    : x => x,
  queryConnect({ settingsCollection: settingsConn }),
  withRouter
)(App)
