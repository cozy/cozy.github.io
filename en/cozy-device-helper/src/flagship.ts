import log from 'cozy-logger'

export enum FlagshipRoutes {
  Home = 'home',
  Cozyapp = 'cozyapp',
  Authenticate = 'authenticate',
  Onboarding = 'onboarding',
  Stack = 'stack'
}

export type BiometryType = 'TouchID' | 'FaceID' | 'Biometrics'

export interface FlagshipMetadata {
  biometry_available?: boolean
  biometry_authorisation_denied?: boolean
  biometry_type?: BiometryType
  immersive?: boolean
  navbarHeight?: number
  offline_available?: boolean
  platform?: Record<string, unknown>
  route?: FlagshipRoutes
  settings_PINEnabled?: boolean
  settings_autoLockDelay?: number
  settings_autoLockEnabled?: boolean
  settings_biometryEnabled?: boolean
  statusBarHeight?: number
  version?: string
}

const getGlobalWindow = (): (Window & typeof globalThis) | undefined =>
  typeof window !== 'undefined'
    ? window
    : (log(
        'error',
        `"window" is not defined. This means that getGlobalWindow() shouldn't have been called and investigation should be done to prevent this call`
      ),
      undefined)

export const getFlagshipMetadata = (): FlagshipMetadata =>
  getGlobalWindow()?.cozy?.flagship ?? {}

export const isFlagshipApp = (): boolean =>
  getGlobalWindow()?.cozy?.flagship !== undefined

export const isFlagshipOfflineSupported = (): boolean =>
  getGlobalWindow()?.cozy?.flagship?.offline_available
