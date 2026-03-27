import memoize from 'lodash/memoize'
import React, { createContext, useEffect, useState } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import CozyClient, {
  CozyProvider,
  RealTimeQueries,
  WebFlagshipLink
} from 'cozy-client'
import { DataProxyProvider } from 'cozy-dataproxy-lib'
import { isFlagshipApp, isFlagshipOfflineSupported } from 'cozy-device-helper'
import CozyDevtools from 'cozy-devtools'
import flag from 'cozy-flags'
import { useWebviewIntent } from 'cozy-intent'
import { RealtimePlugin } from 'cozy-realtime'
import SharingProvider from 'cozy-sharing'
import AlertProvider from 'cozy-ui/transpiled/react/providers/Alert'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import I18n from 'twake-i18n'

import schema from '../schema'
import { ConditionalWrapper } from './ConditionalWrapper'
import { SectionsProvider } from './Sections/SectionsContext'

import { WallPaperProvider } from '@/hooks/useWallpaperContext'
import configureStore from '@/store/configureStore'

const dictRequire = lang => require(`@/locales/${lang}.json`)

export const AppContext = createContext()

/**
 * Setups clients and store
 *
 * Is memoized to avoid several clients in case of hot-reload
 */
export const setupAppContext = memoize(intent => {
  const lang = document.documentElement.getAttribute('lang') || 'en'
  const context = window.context || 'cozy'
  const root = document.querySelector('[role=application]')
  const data = JSON.parse(root.dataset.cozy)

  const shouldUseWebFlagshipLink =
    isFlagshipApp() && isFlagshipOfflineSupported()

  const links = shouldUseWebFlagshipLink
    ? [new WebFlagshipLink({ webviewIntent: intent })]
    : null

  // New improvements must be done with CozyClient
  const cozyClient = new CozyClient({
    uri: `${window.location.protocol}//${data.domain}`,
    schema,
    autoHydrate: true,
    token: data.token,
    useCustomStore: true,
    backgroundFetching: /*       isFlagshipApp() || */ flag(
      'home.store.persist'
    )
      ? true
      : false,
    links
  })

  cozyClient.registerPlugin(flag.plugin)
  cozyClient.registerPlugin(RealtimePlugin)
  // store
  const { store, persistor } = configureStore(cozyClient)
  cozyClient.setStore(store)

  return { cozyClient, store, data, lang, context, persistor }
})

const Inner = ({ children, lang, context }) => (
  <I18n lang={lang} dictRequire={dictRequire} context={context}>
    <SectionsProvider>
      {children}
      <RealTimeQueries doctype="io.cozy.ai.chat.conversations" />
      <RealTimeQueries doctype="io.cozy.ai.chat.assistant" />
      <RealTimeQueries doctype="io.cozy.apps" />
      <RealTimeQueries doctype="io.cozy.files" />
      <RealTimeQueries doctype="io.cozy.jobs" />
      <RealTimeQueries doctype="io.cozy.triggers" />
      <RealTimeQueries doctype="io.cozy.konnectors" />
      <RealTimeQueries doctype="io.cozy.settings" />
      {flag('debug') ? <CozyDevtools /> : null}
    </SectionsProvider>
  </I18n>
)

const ThemeProvider = ({ children }) => {
  return (
    <CozyTheme className="u-flex u-flex-column u-w-100 u-miw-100 u-flex-items-center">
      {children}
    </CozyTheme>
  )
}

/**
 * Setups the app context and creates all context providers and wrappers
 * for an app
 */
const AppWrapper = ({ children }) => {
  const webviewIntent = useWebviewIntent()
  const [appContext, setAppContext] = useState(undefined)

  useEffect(() => {
    if (isFlagshipApp() && !webviewIntent) return

    const newAppContext = setupAppContext(webviewIntent)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppContext(newAppContext)
  }, [webviewIntent])

  if (!appContext) {
    return null
  }

  const { store, cozyClient, context, lang, persistor } = appContext

  return (
    <AppContext.Provider value={appContext}>
      <CozyProvider client={cozyClient}>
        <BreakpointsProvider>
          <SharingProvider doctype="io.cozy.files" documentType="Files">
            <DataProxyProvider>
              <WallPaperProvider>
                <CozyTheme>
                  <ThemeProvider>
                    <AlertProvider>
                      <ReduxProvider store={store}>
                        <ConditionalWrapper
                          condition={persistor}
                          wrapper={children => (
                            <PersistGate loading={null} persistor={persistor}>
                              {children}
                            </PersistGate>
                          )}
                        >
                          <Inner lang={lang} context={context}>
                            {children}
                          </Inner>
                        </ConditionalWrapper>
                      </ReduxProvider>
                    </AlertProvider>
                  </ThemeProvider>
                </CozyTheme>
              </WallPaperProvider>
            </DataProxyProvider>
          </SharingProvider>
        </BreakpointsProvider>
      </CozyProvider>
    </AppContext.Provider>
  )
}

export default React.memo(AppWrapper)
