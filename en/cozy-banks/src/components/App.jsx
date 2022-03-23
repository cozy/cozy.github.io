import React, { useMemo, useEffect } from 'react'
import { withRouter } from 'react-router'
import compose from 'lodash/flowRight'
import throttle from 'lodash/throttle'

import flag from 'cozy-flags'
import { queryConnect, useClient } from 'cozy-client'
import CozyDevTools from 'cozy-client/dist/devtools'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { Content, Layout, Main } from 'cozy-ui/transpiled/react/Layout'
import UISidebar from 'cozy-ui/transpiled/react/Sidebar'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

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
import { isActivatePouch } from 'ducks/client/links'
import banksPanels from 'ducks/devtools/banksPanels'
import { hasFetchFailedError } from 'components/utils'

import styles from 'components/App.styl'
import { useWebviewIntent } from 'cozy-intent'
import { useTheme } from '@material-ui/core'

const KeyboardAwareSidebar = ({ children }) => {
  const showing = useKeyboardState()
  return showing ? null : <UISidebar>{children}</UISidebar>
}

const WAIT_THROTTLE = 30 * 1000

const App = props => {
  const { showBottomNav, settingsCollection } = props
  const { t } = useI18n()
  const client = useClient()
  const settings = getDefaultedSettingsFromCollection(settingsCollection)
  const webviewIntent = useWebviewIntent()
  const theme = useTheme()

  useEffect(() => {
    webviewIntent &&
      theme &&
      webviewIntent.call('setFlagshipUI', {
        topBackground: theme.palette.primary.main,
        topTheme: 'light'
      })
  }, [theme, webviewIntent])

  const showAlert = () => {
    Alerter.info(t('Error.fetch-error'), {
      buttonText: t('General.reload'),
      buttonAction: () => window.location.reload()
    })
  }

  const showAlertThrottled = useMemo(
    () => throttle(showAlert, WAIT_THROTTLE, { trailing: false }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    const onError = e => {
      if (!isActivatePouch() && hasFetchFailedError(e)) {
        showAlertThrottled()
      }
    }

    client.setOnError(onError)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
