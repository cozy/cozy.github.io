const trackerShim = {
  trackPage: () => {},
  trackEvent: () => {},
  name: 'shim'
}

export const getTracker = () => trackerShim
