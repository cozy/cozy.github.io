import React from 'react'
import { I18n } from 'cozy-ui/react'
import { CozyProvider } from 'cozy-client'
import { Provider } from 'react-redux'
import langEn from 'locales/en.json'
import store from 'test/store'
import getClient from 'test/client'

export const TestI18n = ({ children }) => {
  return (
    <I18n lang={'en'} dictRequire={() => langEn}>
      {children}
    </I18n>
  )
}

const AppLike = ({ children, store, client }) => (
  <Provider store={store || (client && client.store)}>
    <CozyProvider client={client || getClient()}>
      <TestI18n>{children}</TestI18n>
    </CozyProvider>
  </Provider>
)

AppLike.defaultProps = {
  store
}

export default AppLike
