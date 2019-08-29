/* global startApp */
import { isAndroidApp } from 'cozy-device-helper'

export const DRIVE_INFO = {
  appId: 'io.cozy.drive.mobile',
  uri: 'cozydrive://'
}

export const BANKS_INFO = {
  appId: 'io.cozy.banks.mobile',
  uri: 'cozybanks://'
}

const cordovaPluginIsInstalled = () => startApp

// startApp does not take the same params on Android and iOS
const getParams = ({ appId, uri }) => {
  if (isAndroidApp()) {
    return {
      package: appId
    }
  } else {
    return uri
  }
}

export const checkApp = async appInfo => {
  const params = getParams(appInfo)
  return new Promise((resolve, reject) => {
    if (cordovaPluginIsInstalled()) {
      startApp.set(params).check(
        infos => {
          if (infos === 'OK') {
            resolve(true)
          } else {
            // Check return infos example :
            // {
            //   versionName: "0.9.2",
            //   packageName: "io.cozy.drive.mobile",
            //   versionCode: 902,
            //   applicationInfo: "ApplicationInfo{70aa0ef io.cozy.drive.mobile}"
            // }
            resolve(infos)
          }
        },
        error => {
          if (error === false || error.indexOf('NameNotFoundException') === 0) {
            // Plugin returns an error 'NameNotFoundException' on Android and
            // false on iOS when application is not found.
            // We prefer to always return false
            resolve(false)
          } else {
            reject(error)
          }
        }
      )
    } else {
      reject(new Error(`Cordova plugin 'com.lampa.startapp' is not installed.`))
    }
  })
}
