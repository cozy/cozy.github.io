import log from 'cozy-logger'

export enum FlagshipRoutes {
  Home = 'home',
  Cozyapp = 'cozyapp',
  Authenticate = 'authenticate',
  Onboarding = 'onboarding',
  Stack = 'stack'
}

export interface FlagshipMetadata {
  immersive?: boolean
  navbarHeight?: number
  platform?: Record<string, unknown>
  route?: FlagshipRoutes
  statusBarHeight?: number
  version?: string
}

const getGlobalWindow = (): Window => {
  if (typeof window !== 'undefined') return window
  else {
    log(
      'error',
      `"window" is not defined. This means that getGlobalWindow() shouldn't have been called and investigation should be done to prevent this call`
    )
    return undefined
  }
}

export const getFlagshipMetadata = (): FlagshipMetadata =>
  getGlobalWindow()?.cozy?.flagship || {}

export const isFlagshipApp = (): boolean =>
  getGlobalWindow()?.cozy?.flagship !== undefined
