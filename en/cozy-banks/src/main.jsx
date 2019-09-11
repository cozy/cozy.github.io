/* global cozy, __TARGET__ */

import 'utils/react-exposer'
import 'whatwg-fetch'
import 'styles/main'

import React from 'react'
import { render } from 'react-dom'
import { loadState, persistState } from 'store/persistedState'
import configureStore from 'store/configureStore'
import 'number-to-locale-string'

import { setupHistory } from 'utils/history'
import { getClient } from 'ducks/client'
import 'utils/flag'
import FastClick from 'fastclick'
import { isSentryEnabled, configureSentry, setURLContext } from 'lib/sentry'
import * as d3 from 'utils/d3'
import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui/dist/cozy-ui.utils.min.css'

import { checkToRefreshToken } from 'utils/token'
import Alerter from 'cozy-ui/react/Alerter'
import flag from 'cozy-flags'
import { makeItShine } from 'utils/display.debug'

const D3_LOCALES_MAP = {
  fr: require('d3-time-format/locale/fr-FR.json'),
  en: require('d3-time-format/locale/en-GB.json')
}

if (__TARGET__ === 'mobile') {
  require('styles/mobile.styl')
}

let store, client, history, lang, root

const initRender = () => {
  const AppContainer = require('./AppContainer').default
  root = render(
    <AppContainer
      store={store}
      client={client}
      lang={lang}
      history={history}
    />,
    document.querySelector('[role=application]', root)
  )
}

const setupApp = async persistedState => {
  const root = document.querySelector('[role=application]')
  const data = root.dataset
  lang =
    __TARGET__ === 'mobile' && navigator && navigator.language
      ? navigator.language.slice(0, 2)
      : data.cozyLocale || 'en'

  d3.timeFormatDefaultLocale(D3_LOCALES_MAP[lang])

  history = setupHistory()

  client = await getClient(persistedState, () => store)
  store = configureStore(client, persistedState)

  persistState(store)

  if (__TARGET__ !== 'mobile') {
    !flag('authentication') &&
      cozy.bar.init({
        appName: data.cozyAppName,
        cozyClient: client,
        iconPath: data.cozyIconPath,
        lang: data.cozyLocale,
        replaceTitleOnMobile: true
      })
  } else {
    const onStartOrResume = checkToRefreshToken(client, store, () => {
      if (flag('debug')) {
        Alerter.info('Token refreshed')
      }
    })
    const openUniversalLink = (/*eventData*/) => {
      /* 
      banks just need to be waked up by an universal link. 
      We currently do not manage any path
    */
    }
    document.addEventListener('deviceready', onStartOrResume)
    document.addEventListener('deviceready', () => {
      if (window.universalLinks) {
        window.universalLinks.subscribe('openUniversalLink', openUniversalLink)
      }
    })
    document.addEventListener('resume', onStartOrResume)
  }

  if (isSentryEnabled()) {
    configureSentry(client)
    if (__TARGET__ === 'browser') {
      setURLContext(window.location.href)
    }
  }

  initRender()
}

document.addEventListener('DOMContentLoaded', () => {
  FastClick.attach(document.body)
  loadState().then(setupApp)
})

if (module.hot) {
  module.hot.accept('./AppContainer', () =>
    requestAnimationFrame(() => {
      makeItShine(document.body)
      initRender()
    })
  )
}
