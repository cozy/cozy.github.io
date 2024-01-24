import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import I18n from "cozy-ui/transpiled/react/providers/I18n"
import { CozyProvider } from 'cozy-client'
import { Provider } from 'react-redux'
import langEn from 'locales/en.json'
import store from 'test/store'
import getClient from 'test/client'
import { BreakpointsProvider } from "cozy-ui/transpiled/react/providers/Breakpoints"
import { TrackerProvider } from 'ducks/tracking/browser'
import { JobsContext } from 'ducks/context/JobsContext'
import { BanksContext } from 'ducks/context/BanksContext'
import SelectionProvider from 'ducks/context/SelectionContext'
import { WebviewIntentProvider } from 'cozy-intent'
import { DisableEnforceFocusModalProvider } from 'ducks/context/DisableEnforceFocusModalContext'

export const TestI18n = ({ children }) => {
  return (
    <I18n lang={'en'} dictRequire={() => langEn}>
      {children}
    </I18n>
  )
}

const AppLike = ({
  children,
  store,
  initialEntries,
  client: clientProps,
  jobsInProgress
}) => {
  const client = clientProps || getClient()
  return (
    <WebviewIntentProvider>
      <TrackerProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <BreakpointsProvider>
            <Provider store={(client && client.store) || store}>
              <CozyProvider client={client}>
                <DisableEnforceFocusModalProvider>
                  <JobsContext.Provider value={{ jobsInProgress }}>
                    <BanksContext.Provider
                      value={{
                        client,
                        jobsInProgress,
                        hasJobsInProgress: jobsInProgress
                          ? jobsInProgress.length > 0
                          : false
                      }}
                    >
                      <SelectionProvider>
                        <TestI18n>{children}</TestI18n>
                      </SelectionProvider>
                    </BanksContext.Provider>
                  </JobsContext.Provider>
                </DisableEnforceFocusModalProvider>
              </CozyProvider>
            </Provider>
          </BreakpointsProvider>
        </MemoryRouter>
      </TrackerProvider>
    </WebviewIntentProvider>
  )
}

AppLike.defaultProps = {
  store
}

export default AppLike
