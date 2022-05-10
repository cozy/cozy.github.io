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

export const getFlagshipMetadata = (): FlagshipMetadata =>
  window.cozy?.flagship || {}

export const isFlagshipApp = (): boolean => window.cozy?.flagship !== undefined
