import { shouldEnableTracking, getTracker } from 'cozy-ui/react/helpers/tracker'
import { hashHistory } from 'react-router'

export const setupHistory = () => {
  const piwikEnabled = shouldEnableTracking() && getTracker()
  let history = hashHistory
  if (piwikEnabled) {
    const trackerInstance = getTracker()
    history = trackerInstance.connectToHistory(history)
    trackerInstance.track(history.getCurrentLocation()) // when using a hash history, the initial visit is not tracked by piwik react router
  }
  return history
}
