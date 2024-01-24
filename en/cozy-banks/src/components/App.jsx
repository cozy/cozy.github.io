import React, { useMemo, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import compose from 'lodash/flowRight'
import throttle from 'lodash/throttle'

import flag from 'cozy-flags'
import { queryConnect, useClient } from 'cozy-client'
import CozyDevTools from 'cozy-client/dist/devtools'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { Content, Layout, Main } from 'cozy-ui/transpiled/react/Layout'
import UISidebar from 'cozy-ui/transpiled/react/Sidebar'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { useTheme } from 'cozy-ui/transpiled/react/styles'

import { settingsConn } from 'doctypes'
import Nav from 'ducks/commons/Nav'
import SelectedTagsProvider from 'ducks/context/SelectedTagsContext'
import { getDefaultedSettingsFromCollection } from 'ducks/settings/helpers'
import ErrorBoundary from 'components/ErrorBoundary'
import ReactHint from 'components/ReactHint'
import AppSearchBar from 'components/AppSearchBar'
import useKeyboardState from 'components/useKeyboardState'
import { isActivatePouch } from 'ducks/client/links'
import banksPanels from 'ducks/devtools/banksPanels'
import { hasFetchFailedError } from 'components/utils'

import styles from 'components/App.styl'
import { useWebviewIntent } from 'cozy-intent'

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
    <SelectedTagsProvider>
      <AppSearchBar />
      <Layout>
        {showBottomNav && (
          <KeyboardAwareSidebar>
            <Nav />
          </KeyboardAwareSidebar>
        )}

        <Main>
          <Content className={styles.Main}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </Content>
        </Main>

        {/* Outside every other component to bypass overflow:hidden */}
        <ReactHint />
        <Alerter />
      </Layout>
      {flag('debug') ? <CozyDevTools panels={banksPanels} /> : null}
    </SelectedTagsProvider>
  )
}

App.defaultProps = {
  showBottomNav: true
}

export default compose(queryConnect({ settingsCollection: settingsConn }))(App)
