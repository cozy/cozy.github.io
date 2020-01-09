/* global __TARGET__ */

import { I18n } from 'cozy-ui/transpiled/react'
import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import React from 'react'
import { CozyProvider } from 'cozy-client'
import { Provider } from 'react-redux'
import flag from 'cozy-flags'
import { Sprite as IconSprite } from 'cozy-ui/transpiled/react/Icon'

const AppContainer = ({ store, lang, history, client }) => {
  const AppRoute = require('components/AppRoute').default
  const Router =
    __TARGET__ === 'mobile' || flag('authentication')
      ? require('ducks/mobile/MobileRouter').default
      : require('react-router').Router
  return (
    <>
      <IconSprite />
      <Provider store={store}>
        <CozyProvider client={client}>
          <I18n lang={lang} dictRequire={lang => require(`locales/${lang}`)}>
            <MuiCozyTheme>
              <Router history={history} routes={AppRoute()} />
            </MuiCozyTheme>
          </I18n>
        </CozyProvider>
      </Provider>
    </>
  )
}

export default AppContainer
