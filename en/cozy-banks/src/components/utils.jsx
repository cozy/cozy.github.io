const FAILED_TO_FETCH_ERROR = 'Failed to fetch'

export const hasFetchFailedError = error =>
  error.message === FAILED_TO_FETCH_ERROR
