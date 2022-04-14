/* global __SENTRY_URL__, __TARGET__, __DEVELOPMENT__, __APP_VERSION__ */
import Raven from 'raven-js'
import RavenMiddleWare from 'redux-raven-middleware'
import { getDomain, getSlug } from 'lib/cozyUrl'

let domain
let slug

export const normalizeData = data => {
  data = normalizeRequestUrl(data)
  data = normalizeStacktrace(data)
  data = normalizeBreadcrumbs(data)

  return data
}

// Configure

export const isSentryEnabled = () => typeof __SENTRY_URL__ !== 'undefined' && process.env.NODE_ENV == 'production'

const getSentryConfiguration = cozyClient => {
  const config = {
    shouldSendCallback: true,
    environment: __DEVELOPMENT__ ? 'development' : 'production',
    release: __APP_VERSION__,
    allowSecretKey: true,
    dataCallback: normalizeData
  }

  if (__TARGET__ === 'browser') {
    config.transport = options => {
      const { auth, data } = options
      const parameters = {
        ...auth,
        project: data.project,
        data: JSON.stringify(data)
      }
      cozyClient.stackClient
        .fetchJSON('POST', '/remote/cc.cozycloud.errors', parameters)
        .catch(options.onError)
        .then(options.onSuccess)
    }
  }

  return config
}

export const setURLContext = url => {
  domain = getDomain(url)
  slug = getSlug(url)
}

export const getSentryMiddleware = cozyClient => {
  return RavenMiddleWare(__SENTRY_URL__, getSentryConfiguration(cozyClient))
}

export const configureSentry = cozyClient => {
  Raven.config(__SENTRY_URL__, getSentryConfiguration(cozyClient)).install()
  Raven.setTagsContext({ instance: cozyClient.stackClient.uri, target: __TARGET__ })
}

// Normalize

const normalizeRequestUrl = data => {
  if (data && data.request && data.request.url) {
    const urlFragment = data.request.url.split('#', 2)
    if (urlFragment.length === 2) {
      data.request.url = 'banks://index.html#' + urlFragment[1]
    }
  }

  return data
}

const normalizeStacktrace = data => {
  if (
    data &&
    data.stacktrace &&
    data.stacktrace.frames &&
    data.stacktrace.frames.length > 0
  ) {
    const scriptRegex = new RegExp('/([a-z]+.js.*)')
    data.stacktrace.frames = data.stacktrace.frames.map(frame => {
      const filenameFragment = frame.filename.match(scriptRegex)
      if (filenameFragment && filenameFragment.length > 1) {
        frame.filename = 'banks://' + filenameFragment[1]
      }

      return frame
    })
  }

  return data
}

const normalizeBreadcrumbs = data => {
  if (
    data &&
    data.breadcrumbs &&
    data.breadcrumbs.values &&
    data.breadcrumbs.values.length > 0
  ) {
    const cleanUrl = url => {
      const urlFragment = url.split('index.html')
      if (urlFragment.length > 1) {
        return `banks://index.html${urlFragment[1]}`
      }
      return url
    }

    data.breadcrumbs.values = data.breadcrumbs.values.map(breadcrumb => {
      if (breadcrumb.data && breadcrumb.data.from) {
        breadcrumb.data.from = cleanUrl(breadcrumb.data.from)
      }

      if (breadcrumb.data && breadcrumb.data.to) {
        breadcrumb.data.to = cleanUrl(breadcrumb.data.to)
      }

      return breadcrumb
    })

    return data
  }
}

// LOG

const logMessage = (message, level = 'info') => {
  return new Promise(resolve => {
    Raven.captureMessage(message, {
      level,
      tags: { slug, domain }
    })
    resolve()
  })
}

export const logException = err => {
  return new Promise(resolve => {
    Raven.captureException(err, {
      tags: { slug, domain }
    })
    // eslint-disable-next-line no-console
    console.warn('Raven is recording exception')
    // eslint-disable-next-line no-console
    console.error(err)
    resolve()
  })
}

export const logInfo = message => logMessage(message)

export class SentryCozyClientPlugin {
  constructor(client) {
    if (__TARGET__ === 'browser') {
      setURLContext(client.stackClient.uri)
    }
    if (isSentryEnabled()) {
      configureSentry(client)
    }
    client.on('login', () => {
      setURLContext(client.stackClient.uri)
    })
  }
}

SentryCozyClientPlugin.pluginName = 'sentry'
