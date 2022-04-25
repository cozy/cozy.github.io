import { FlagshipMetadata } from './flagship'

export const ANDROID_PLATFORM = 'android'
export const IOS_PLATFORM = 'ios'

declare global {
  interface Navigator {
    msLaunchUri?: (
      uri: string,
      successCallback?: () => void,
      noHandlerCallback?: () => void
    ) => void
  }
  interface Window {
    InstallTrigger?: Record<string, unknown>
    opera?: Record<string, unknown>
    MSStream?: unknown
    chrome?: Record<string, unknown>
    SafariViewController: {
      isAvailable: (cb: (available: boolean) => void) => void
      show: (
        config: { url: Location; transition: string },
        onResult: (result: { event: string }) => void,
        onFail: () => void
      ) => void
      hide: () => void
    }
    cordova?: {
      InAppBrowser: {
        open: (url: Location, target: string, options: string) => void
      }
      platformId: typeof ANDROID_PLATFORM | typeof IOS_PLATFORM
    }
    device?: {
      manufacturer: string
      model: string
    }
    startApp?: {
      set: (params: { package: string } | string) => {
        check: (onResult, onFail) => void
        start: (
          resolve: (value: false | void | PromiseLike<false | void>) => void,
          reject: (reason?: unknown) => void
        ) => void
      }
    }
    cozy?: {
      flagship?: FlagshipMetadata
      isFlagshipApp?: boolean
    }
  }
}
