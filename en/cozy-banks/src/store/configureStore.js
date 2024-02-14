/* global __DEVELOPMENT__ */
import { compose, createStore, applyMiddleware, combineReducers } from 'redux'
import * as Sentry from '@sentry/react'

import thunkMiddleware from 'redux-thunk'
import { createLogger } from 'redux-logger'
import flag from 'cozy-flags'
import {
  shouldEnableTracking,
  getTracker,
  createTrackerMiddleware
} from 'cozy-ui/transpiled/react/helpers/tracker'

import filters from 'ducks/filters'
import brands from 'ducks/brandDictionary/brandsReducer'

const configureStore = (cozyClient, persistedState) => {
  // Enable Redux dev tools
  const composeEnhancers =
    (__DEVELOPMENT__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

  // middlewares
  const middlewares = [thunkMiddleware]
  if (shouldEnableTracking() && getTracker()) {
    middlewares.push(createTrackerMiddleware())
  }
  if (flag('logs') && __DEVELOPMENT__) { // eslint-disable-line
    // must be the last middleware in chain https://git.io/vHQpt
    const loggerMiddleware = createLogger()
    middlewares.push(loggerMiddleware)
  }

  const sentryReduxEnhancer = Sentry.createReduxEnhancer({
    actionTransformer: ({ type, queryId }) => ({
      type,
      queryId
    }),
    stateTransformer: () => null,
    attachReduxState: false
  })

  const store = createStore(
    combineReducers({
      brands,
      filters,
      cozy: cozyClient.reducer()
    }),
    persistedState,
    composeEnhancers(
      applyMiddleware.apply(null, middlewares),
      sentryReduxEnhancer
    )
  )

  return store
}

export default configureStore
