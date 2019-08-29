import { isBefore, subDays, isValid } from 'date-fns'

/**
 * This check will be removed when we will be able to inject a cozy-client
 * in the cozy-bar, thus it can renew the token it needed by itself.
 * For now, we ensure that the token is refreshed before it expires,
 * so the bar always has a valid token
 */
const checkToRefreshToken = (client, store, onRefresh) => () => {
  const state = store.getState()
  const token = state.mobile && state.mobile.token

  if (!token) {
    return
  }

  // Since the token is valid for a week, we refresh it
  // if it was issued more than 6 days ago
  const today = new Date()
  const sixDaysAgo = subDays(today, 6)
  const { issuedAt } = token

  if (!issuedAt || !isValid(issuedAt) || isBefore(issuedAt, sixDaysAgo)) {
    try {
      client.stackClient.refreshToken()
      onRefresh && onRefresh()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error while refreshing token:' + err)
    }
  }
}

export { checkToRefreshToken }
