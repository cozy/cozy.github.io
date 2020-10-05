/* global __PIWIK_SITEID__, __PIWIK_TRACKER_URL__ */

import MatomoTracker from 'matomo-tracker'
import logger from 'cozy-logger'

const log = logger.namespace('matomo-node-tracker')

class NodeTracker {
  constructor(defaultOpts) {
    this.tracker = new MatomoTracker(__PIWIK_SITEID__, __PIWIK_TRACKER_URL__)

    this.tracker.on('error', err => {
      log('error', err)
    })

    this.opts = Object.assign(
      {
        url: process.env.COZY_URL,
        e_c: 'Banks'
      },
      defaultOpts
    )
  }

  trackEvent(eventOpts) {
    const event = {
      ...this.opts,
      ...eventOpts
    }

    const stringifiedEvent = JSON.stringify(event)

    if (process.env.NODE_ENV === 'production') {
      log('info', `Send event to Piwik ${stringifiedEvent}`)
      this.tracker.track(event)
    } else {
      log(
        'info',
        `Not in production env, the following event was not sent to Matomo: ${stringifiedEvent}`
      )
    }
  }
}

export function getTracker(target, opts = {}) {
  return new NodeTracker(opts)
}
