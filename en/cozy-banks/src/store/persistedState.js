import localforage from 'localforage'

export const loadState = async () => {
  try {
    const persistedState = await localforage.getItem('state')
    if (persistedState === null) {
      return undefined
    }
    return persistedState
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err)
    return undefined
  }
}

export const saveState = async state => {
  try {
    localforage.setItem('state', state)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err)
    // Errors handling
  }
}

export const persistState = store => {
  store.subscribe(() =>
    saveState({
      filters: {
        filteringDoc: store.getState().filters.filteringDoc
      }
    })
  )
}
