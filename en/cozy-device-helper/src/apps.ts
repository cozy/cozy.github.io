import { isAndroidApp } from './platform'

const cordovaPluginIsInstalled = (): Window['startApp'] => window.startApp

type AppInfo = {
  appId: string
  uri: string
}

/**
 * Normalize startApp params for Android and iOS
 */
const getParams = ({ appId, uri }: AppInfo): { package: string } | string => {
  if (isAndroidApp()) {
    return {
      package: appId
    }
  } else {
    return uri
  }
}

const exported: {
  startApp?: {
    (arg0: { appId: string; uri: string }): unknown
    (appInfo: AppInfo): Promise<false | void>
  }
  checkApp?: (appInfo: AppInfo) => Promise<
    | boolean
    | string
    | {
        versionName: string
        packageName: string
        versionCode: number
        applicationInfo: string
      }
  >
} = {}

/**
 * Start an application if it is installed on the phone
 * @returns Promise - False if the application was not able to be started
 */
const startApp = (exported.startApp = async function (
  appInfo: AppInfo
): Promise<void | false> {
  const startAppPlugin = window.startApp
  const isAppInstalled = await exported.checkApp(appInfo)
  if (isAppInstalled) {
    const params = getParams(appInfo)
    return new Promise((resolve, reject) => {
      if (!cordovaPluginIsInstalled()) {
        reject(
          new Error(
            `Cordova plugin 'com.lampa.startapp' is not installed. This plugin is needed to start a native app. Required by cozy-bar`
          )
        )
        return
      }

      startAppPlugin.set(params).start(resolve, reject)
    })
  } else {
    return false
  }
})

/**
 * Check that an application is installed on the phone
 * @returns Promise - Promise containing information on the application
 *
 * @example
 * > checkApp({ appId: 'io.cozy.drive.mobile', uri: 'cozydrive://' })
 * Promise.resolve({
 *  versionName: "0.9.2",
 *  packageName: "io.cozy.drive.mobile",
 *  versionCode: 902,
 *  applicationInfo: "ApplicationInfo{70aa0ef io.cozy.drive.mobile}"
 * })
 */
const checkApp = (exported.checkApp = async function (appInfo): Promise<
  | boolean
  | string
  | {
      versionName: string
      packageName: string
      versionCode: number
      applicationInfo: string
    }
> {
  const startAppPlugin = window.startApp
  const params = getParams(appInfo)
  return new Promise((resolve, reject) => {
    if (!cordovaPluginIsInstalled()) {
      reject(new Error(`Cordova plugin 'com.lampa.startapp' is not installed.`))
      return
    }

    startAppPlugin.set(params).check(
      (
        infos:
          | string
          | {
              versionName: string
              packageName: string
              versionCode: number
              applicationInfo: string
            }
          | PromiseLike<{
              versionName: string
              packageName: string
              versionCode: number
              applicationInfo: string
            }>
      ) => {
        return resolve(infos === 'OK' ? true : infos)
      },
      (error: boolean | string) => {
        if (
          error === false ||
          (error as string).indexOf('NameNotFoundException') === 0
        ) {
          // Plugin returns an error 'NameNotFoundException' on Android and
          // false on iOS when an application is not found.
          // We prefer to always return false
          resolve(false)
        } else {
          reject(error)
        }
      }
    )
  })
})

export { checkApp, startApp }
export default exported
