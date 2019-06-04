// cordova
export const isCordova = () =>
  typeof window !== 'undefined' && window.cordova !== undefined
