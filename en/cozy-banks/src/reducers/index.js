import { combineReducers } from 'redux'

import filters from 'ducks/filters'

export const reducers = {
  filters
}

const combinedReducers = combineReducers(reducers)

export default combinedReducers
