// Uncomment to activate why-did-you-render
// https://github.com/welldone-software/why-did-you-render
// import '../../wdyr'

import 'utils/react-exposer'
import 'whatwg-fetch'

import 'src/styles/main.styl'
import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui/dist/cozy-ui.utils.min.css'

import React from 'react'
import { render } from 'react-dom'
import { loadState, persistState } from 'store/persistedState'
import configureStore from 'store/configureStore'
import 'number-to-locale-string'
import FastClick from 'fastclick'
import { captureConsoleIntegration } from '@sentry/integrations'
import * as Sentry from '@sentry/react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes
} from 'react-router-dom'

import { setupLocale as setupD3Locale } from 'utils/d3'
import { isIOSApp } from 'cozy-device-helper'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import flag from 'cozy-flags'
import { handleOAuthResponse } from 'cozy-harvest-lib'

import {
  getClient,
  CleanupStoreClientPlugin,
  StartupChecksPlugin
} from 'ducks/client'
import 'utils/flag'
import { makeItShine } from 'utils/display.debug'
import cozyBar from 'utils/cozyBar'

import { getLanguageFromDOM } from 'utils/lang'
import manifest from '../../../manifest.webapp'

import 'lib/logger'
import parseCozyData from 'utils/cozyData'

let store, client, lang, root

const initRender = () => {
  if (handleOAuthResponse()) {
    render(
      <Spinner size="xxlarge" middle={true} />,
      document.querySelector('[role=application]')
    )
    return
  }
  const AppContainer = require('../../AppContainer').default
  root = render(
    <AppContainer store={store} client={client} lang={lang} />,
    document.querySelector('[role=application]', root)
  )
}

const setupApp = async persistedState => {
  const root = document.querySelector('[role=application]')
  lang = getLanguageFromDOM(root)

  setupD3Locale(lang)

  client = await getClient(persistedState)
  store = configureStore(client, persistedState)
  client.registerPlugin(CleanupStoreClientPlugin, { store })
  client.registerPlugin(flag.plugin)
  client.registerPlugin(StartupChecksPlugin, {
    launchTriggers: [
      {
        slug: 'banks',
        name: 'autogroups',
        type: '@event',
        policy: 'never-executed'
      }
    ],

    // Delay startup checks to lessen the load at page startup
    delay: 5000
  })

  const refreshFlags = async () => {
    // TODO Remove else block after https://github.com/cozy/cozy-libs/pull/1115
    // is merged
    if (client.plugins.flags.refresh) {
      await client.plugins.flags.refresh()
    } else {
      await flag.initializeFromRemote(client)
    }
  }

  document.addEventListener('resume', () => {
    refreshFlags()
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshFlags()
    }
  })

  client.setStore(store)

  persistState(store)

  const {
    app: { icon, name },
    locale
  } = parseCozyData(root)
  !flag('authentication') &&
    cozyBar.init({
      appName: name,
      cozyClient: client,
      iconPath: icon,
      lang: locale,
      replaceTitleOnMobile: true
    })

  Sentry.init({
    dsn: 'https://d18802c5412f4b8babe4aad094618d37@errors.cozycloud.cc/38',
    environment: process.env.NODE_ENV,
    release: manifest.version,
    integrations: [
      captureConsoleIntegration({ levels: ['error'] }), // We also want to capture the `console.error` to, among other things, report the logs present in the `try/catch`
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      })
    ],
    tracesSampleRate: 0.1,
    // React log these warnings(bad Proptypes), in a console.error, it is not relevant to report this type of information to Sentry
    ignoreErrors: [/^Warning: /]
  })

  initRender()
}

document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line
  loadState().then(setupApp)

  // We add fastclick only for iOS since Chrome removed this behavior (iOS also, but
  // we still use UIWebview and not WKWebview... )
  if (isIOSApp()) {
    FastClick.attach(document.body)
  }
})

if (module.hot) {
  module.hot.accept('../../AppContainer', () =>
    requestAnimationFrame(() => {
      makeItShine(document.body)
      initRender()
    })
  )
}
