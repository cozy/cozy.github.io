/* global __TARGET__ */

import React, { useMemo } from 'react'
import { Provider } from 'react-redux'

import { WebviewIntentProvider } from 'cozy-intent'
import I18n, { initTranslation } from 'cozy-ui/transpiled/react/I18n'
import MuiCozyTheme from 'cozy-ui/transpiled/react/MuiCozyTheme'
import { CozyProvider, RealTimeQueries } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles'

import flag from 'cozy-flags'

import { TrackerProvider } from 'ducks/tracking/browser'
import JobsProvider from 'ducks/context/JobsContext'
import { CozyConfirmDialogProvider } from 'cozy-harvest-lib'
import BanksProvider from 'ducks/context/BanksContext'
import SelectionProvider from 'ducks/context/SelectionContext'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import cozyBar from 'utils/cozyBar'
import {
  TRIGGER_DOCTYPE,
  ACCOUNT_DOCTYPE,
  COZY_ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  GROUP_DOCTYPE
} from 'doctypes'
import { StoreURLProvider } from 'ducks/store/StoreContext'
const jobsProviderOptions = t => ({
  onSuccess: () => Alerter.success(t('JobsContext.alerter-success')),
  onError: () => Alerter.error(t('JobsContext.alerter-errored'))
})

const initT = (lang, dictRequire) => {
  const polyglot = initTranslation(lang, dictRequire)
  const t = polyglot.t.bind(polyglot)
  return { t }
}

/*
With MUI V4, it is possible to generate deterministic class names.
In the case of multiple react roots, it is necessary to disable this
feature. Since we have the cozy-bar root, we need to disable the
feature.

https://material-ui.com/styles/api/#stylesprovider
*/
const generateClassName = createGenerateClassName({
  disableGlobal: true,
  productionPrefix: 'c'
})

const AppContainer = ({ store, lang, history, client }) => {
  const AppRoute = require('components/AppRoute').default
  const Router =
    __TARGET__ === 'mobile' || flag('authentication')
      ? require('ducks/mobile/MobileRouter').default
      : require('react-router').Router

  const dictRequire = lang => require(`locales/${lang}`)
  const { t } = useMemo(() => {
    return initT(lang, dictRequire)
  }, [lang])

  return (
    <WebviewIntentProvider setBarContext={cozyBar.setWebviewContext}>
      <BreakpointsProvider>
        <TrackerProvider>
          <Provider store={store}>
            <StylesProvider generateClassName={generateClassName}>
              <CozyProvider client={client}>
                <I18n
                  lang={lang}
                  dictRequire={lang => require(`locales/${lang}`)}
                >
                  <JobsProvider
                    client={client}
                    options={jobsProviderOptions(t)}
                  >
                    <BanksProvider client={client}>
                      <SelectionProvider>
                        <StoreURLProvider>
                          <MuiCozyTheme>
                            <CozyConfirmDialogProvider>
                              <RealTimeQueries doctype={TRIGGER_DOCTYPE} />
                              <RealTimeQueries doctype={ACCOUNT_DOCTYPE} />
                              <RealTimeQueries doctype={COZY_ACCOUNT_DOCTYPE} />
                              <RealTimeQueries doctype={TRANSACTION_DOCTYPE} />
                              <RealTimeQueries doctype={GROUP_DOCTYPE} />
                              <Router history={history} routes={AppRoute()} />
                            </CozyConfirmDialogProvider>
                          </MuiCozyTheme>
                        </StoreURLProvider>
                      </SelectionProvider>
                    </BanksProvider>
                  </JobsProvider>
                </I18n>
              </CozyProvider>
            </StylesProvider>
          </Provider>
        </TrackerProvider>
      </BreakpointsProvider>
    </WebviewIntentProvider>
  )
}

export default AppContainer
