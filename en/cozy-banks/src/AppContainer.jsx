import React, { useEffect, useMemo } from 'react'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'

import { WebviewIntentProvider } from 'cozy-intent'
import { CozyConfirmDialogProvider } from 'cozy-harvest-lib'
import I18n, { initTranslation } from 'cozy-ui/transpiled/react/providers/I18n'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { CozyProvider, RealTimeQueries } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import {
  StylesProvider,
  createGenerateClassName
} from '@material-ui/core/styles'

import { TrackerProvider } from 'ducks/tracking/browser'
import JobsProvider from 'ducks/context/JobsContext'
import BanksProvider from 'ducks/context/BanksContext'
import SelectionProvider from 'ducks/context/SelectionContext'
import AppRoute from 'components/AppRoute'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import cozyBar from 'utils/cozyBar'
import {
  TRIGGER_DOCTYPE,
  ACCOUNT_DOCTYPE,
  COZY_ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  GROUP_DOCTYPE,
  FILES_DOCTYPE,
  JOBS_DOCTYPE
} from 'doctypes'
import { StoreURLProvider } from 'ducks/store/StoreContext'
import { DisableEnforceFocusModalProvider } from 'ducks/context/DisableEnforceFocusModalContext'
import { makeBrands } from 'ducks/brandDictionary/brandsReducer'

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

const AppContainer = ({ store, lang, client }) => {
  const dictRequire = lang => require(`locales/${lang}`)
  const { t } = useMemo(() => {
    return initT(lang, dictRequire)
  }, [lang])

  useEffect(() => {
    store.dispatch(dispatch => makeBrands(client, dispatch))
  }, [store, client])

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
                  <DisableEnforceFocusModalProvider>
                    <JobsProvider
                      client={client}
                      options={jobsProviderOptions(t)}
                    >
                      <BanksProvider client={client}>
                        <SelectionProvider>
                          <StoreURLProvider>
                            <CozyTheme>
                              <CozyConfirmDialogProvider>
                                <RealTimeQueries doctype={TRIGGER_DOCTYPE} />
                                <RealTimeQueries doctype={ACCOUNT_DOCTYPE} />
                                <RealTimeQueries
                                  doctype={COZY_ACCOUNT_DOCTYPE}
                                />
                                <RealTimeQueries
                                  doctype={TRANSACTION_DOCTYPE}
                                />
                                <RealTimeQueries doctype={GROUP_DOCTYPE} />
                                <RealTimeQueries doctype={FILES_DOCTYPE} />
                                <RealTimeQueries doctype={JOBS_DOCTYPE} />
                                <HashRouter>
                                  <AppRoute />
                                </HashRouter>
                              </CozyConfirmDialogProvider>
                            </CozyTheme>
                          </StoreURLProvider>
                        </SelectionProvider>
                      </BanksProvider>
                    </JobsProvider>
                  </DisableEnforceFocusModalProvider>
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
