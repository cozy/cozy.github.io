import React from 'react'
import { I18n } from 'cozy-ui/react'
import { CozyProvider } from 'cozy-client'
import { Provider } from 'react-redux'
import langEn from 'locales/en.json'
import store from 'test/store'
import getClient from 'test/client'

const AppLike = ({ children, store, client }) => (
  <Provider store={store}>
    <CozyProvider client={client || getClient()}>
      <I18n lang={'en'} dictRequire={() => langEn}>
        {children}
      </I18n>
    </CozyProvider>
  </Provider>
)

AppLike.defaultProps = {
  store
}

export default AppLike
