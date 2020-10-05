/* global __TARGET__ */

import React from 'react'
import { Provider } from 'react-redux'

import I18n from 'cozy-ui/transpiled/react/I18n'
import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import { Sprite as IconSprite } from 'cozy-ui/transpiled/react/Icon'
import { CozyProvider } from 'cozy-client'
import flag from 'cozy-flags'

import { TrackerProvider } from 'ducks/tracking/browser'

const AppContainer = ({ store, lang, history, client }) => {
  const AppRoute = require('components/AppRoute').default
  const Router =
    __TARGET__ === 'mobile' || flag('authentication')
      ? require('ducks/mobile/MobileRouter').default
      : require('react-router').Router
  return (
    <>
      <IconSprite />
      <TrackerProvider>
        <Provider store={store}>
          <CozyProvider client={client}>
            <I18n lang={lang} dictRequire={lang => require(`locales/${lang}`)}>
              <MuiCozyTheme>
                <Router history={history} routes={AppRoute()} />
              </MuiCozyTheme>
            </I18n>
          </CozyProvider>
        </Provider>
      </TrackerProvider>
    </>
  )
}

export default AppContainer
