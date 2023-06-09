import isEqual from 'lodash/isEqual'
import pick from 'lodash/pick'
import pullAt from 'lodash/pullAt'
import remove from 'lodash/remove'
import uniqWith from 'lodash/uniqWith'

import {
  allowDoubleSubscriptions,
  requireDoubleUnsubscriptions,
  onDoubleSubscriptions,
  eventNames
} from './config'
import defaultLogger from './logger'

/**
 * @typedef {object} SubscriptionRequest
 * @property {EventName} event
 * @property {string} type
 * @property {string|undefined|function} id - (or handler is `handler` is undefined)
 * @property {function|undefined} handler - (not used if `id` is a function)
 */

/**
 * @typedef {object} RealtimeEvent
 * @property {event}
 */

/**
 * Manage event subscriptions
 */
export default class SubscriptionList {
  constructor(options = {}) {
    this.subscriptions = []
    this.logger = options.logger || defaultLogger
  }

  /**
   * Adds a subscription to the list
   *
   * @private
   * @param {Subscription} request
   */
  add(request) {
    const subscription = this.normalize(request)
    const found = this.subscriptions.find(s => isEqual(s, subscription))
    if (found) {
      onDoubleSubscriptions &&
        onDoubleSubscriptions(subscription, { logger: this.logger })
      if (!allowDoubleSubscriptions) return
    }
    this.subscriptions.push(subscription)
  }

  /**
   * Remove a subscription from the list
   *
   * @param {Subscription} request
   */
  remove(request) {
    const subscription = this.normalize(request)
    if (requireDoubleUnsubscriptions) {
      // remove only the first matching
      const found = this.subscriptions.findIndex(s => isEqual(s, subscription))
      if (found >= 0) {
        pullAt(this.subscriptions, found)
        return
      }
    } else {
      // remove all matching
      const removed = remove(this.subscriptions, s => isEqual(s, subscription))
      if (removed && removed.length > 0) return
    }
    this.logger.warn(
      'Trying to unsubscribe to an unknown subscription',
      subscription
    )
  }

  /**
   * Get all subscriptions
   *
   * @returns {Subscription[]}
   */
  getAll() {
    return this.subscriptions.slice()
  }

  /**
   * Get all distinct  `type` and `id` pairs from the list
   *
   * @returns {{type, id}[]}
   */
  getAllTypeAndIdPairs() {
    const map = subscription => pick(subscription, ['type', 'id'])
    return uniqWith(this.subscriptions.map(map), isEqual)
  }

  /**
   * Check if a subscription in the list matches the pair `type` and `id`
   *
   * @param {string|null} type
   * @param {string|null} id
   * @returns {boolean}
   */
  hasSameTypeAndId({ type: optionType, id: optionId }) {
    const type = optionType || null
    const id = optionId || null
    return !!this.subscriptions.find(s => s.type === type && s.id === id)
  }

  /**
   * Get all handlers for an event
   *
   * @param {string} event
   * @param {string} type
   * @param {string} id
   * @returns {function[]}
   */
  getAllHandlersForEvent(event, type, id) {
    const matcher = s => this.isMatchingEvent(s, event, type, id)
    const matching = this.subscriptions.filter(matcher)
    return matching.map(s => s.handler)
  }

  /**
   * Test if a subscription match an event
   *
   * @private
   * @param {Subscription} sub
   * @param {string} event
   * @param {string} type
   * @param {string} id
   * @returns {boolean}
   */
  isMatchingEvent(sub, event, type, id) {
    if (sub.event && sub.event !== event) return false
    if (sub.id && sub.id !== (id || null)) return false
    if (sub.type && sub.type !== (type || null)) return false
    return true
  }

  /**
   * Test is there is any subscription in the list
   *
   * @returns {boolean} true if empty
   */
  isEmpty() {
    return this.subscriptions.length === 0
  }

  /**
   * Normalize falsy values in subscriptions requests
   *
   * @private
   * @param {Subscription} sub
   * @returns {Subscription}
   */
  normalize(sub) {
    function error(msg) {
      this.logger.error(msg)
      throw new Error(msg)
    }

    if (sub.event && !eventNames.includes(sub.event)) {
      error(`Trying to subscribe to a unknown event name ${sub.event}`)
    }
    if (typeof sub.handler !== 'function') {
      error(`Trying to subscribe with a non-function handler ${sub.event}`)
    }
    if (sub.event !== 'error' && typeof sub.type !== 'string') {
      error(`Trying to subscribe with to non-string type ${sub.type}`)
    }
    if (sub.id && typeof sub.id !== 'string') {
      error(`Trying to subscribe with to non-string id ${sub.id}`)
    }
    return {
      event: sub.event || null,
      type: sub.type || null,
      id: sub.id || null,
      handler: sub.handler || null
    }
  }
}
