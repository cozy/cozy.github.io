import React, { useContext, createContext, useEffect } from 'react'
import { getTracker } from 'ducks/tracking/tracker'

export { getTracker }

export const trackEvent = options => {
  const tracker = getTracker()
  tracker.trackEvent(options)
}

export const trackPage = options => {
  const tracker = getTracker()
  tracker.trackPage(options)
}

export const TrackerContext = createContext()

export const TrackerProvider = ({ children }) => {
  const tracker = getTracker()
  return (
    <TrackerContext.Provider value={tracker}>
      {children}
    </TrackerContext.Provider>
  )
}

export const useTracker = () => {
  return useContext(TrackerContext)
}

export const useTrackPage = pageName => {
  const tracker = useTracker()

  useEffect(() => {
    if (!pageName || !tracker) {
      return
    }
    tracker.trackPage(pageName)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
