// cordova
export const isCordova = (): boolean =>
  typeof window !== 'undefined' && window.cordova !== undefined
