import MicroEE from 'microee'

import logger from './logger'

import {
  maxWaitBetweenRetries as defaultMaxWaitBetweenRetries,
  baseWaitAfterFirstFailure as defaultBaseWaitAfterFirstFailure,
  timeBeforeSuccessful as defaultTimeBeforeSuccessful,
  raiseErrorAfterAttempts as defaultRaiseErrorAfterAttempts
} from './config'

/**
 * This class creates an helper for processes that need
 * a retry mechanism with some wait between failed attempts.
 */
class RetryManager {
  /**
   * @constructor
   * @param {object} options
   * @param {number} maxWaitBetweenRetries - will never wait more than this time (in ms) between attempts
   * @param {number} baseWaitAfterFirstFailure - how much time in ms should we wait after the first failure?
   * @param {number} timeBeforeSuccessful - how much time should  we wait without error to acknowledge a success?
   * @param {number} raiseErrorAfterAttempts - after how many failed attempts should we raise an error?
   */
  constructor({
    maxWaitBetweenRetries = defaultMaxWaitBetweenRetries,
    baseWaitAfterFirstFailure = defaultBaseWaitAfterFirstFailure,
    timeBeforeSuccessful = defaultTimeBeforeSuccessful,
    raiseErrorAfterAttempts = defaultRaiseErrorAfterAttempts
  } = {}) {
    this.reset()
    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
    this.onSuccessAcknowledged = this.onSuccessAcknowledged.bind(this)
    this.raiseErrorAfterAttempts = raiseErrorAfterAttempts
    this.timeBeforeSuccessful = timeBeforeSuccessful
    this.baseWaitAfterFirstFailure = baseWaitAfterFirstFailure
    this.maxWaitBetweenRetries = maxWaitBetweenRetries
  }

  /**
   * On a success
   *
   * If `this.timeBeforeSuccessful` if not null, it will wait this amount of
   * time without errors before acknowleding a success
   */
  onSuccess() {
    if (this.timeBeforeSuccessful > 0) {
      this.startSuccessWatcher(
        this.onSuccessAcknowledged,
        this.timeBeforeSuccessful
      )
    } else {
      this.onSuccessAcknowledged()
    }
  }

  /**
   * Acknowledge a success
   *
   * @private
   */
  onSuccessAcknowledged() {
    this.emit('success')
    this.reset()
  }

  /**
   * Clears the success watcher
   *
   * @private
   */
  clearSuccessWatcher() {
    if (this.successWatcher) {
      global.clearTimeout(this.successWatcher)
      this.successWatcher = null
    }
  }

  /**
   * Starts the success watcher
   *
   * We don't want to consider a success immediatly when the connection is opened.
   * We wait a short amount of time to see if some error raises, and only acknowledge
   * a success if no error raises in this timeframe.
   * The success watcher is the function that start this timer.
   *
   * @private
   * @param {function} ack - will be called after the wait time
   * @param {number} time - waiting time
   */
  startSuccessWatcher(ack, time) {
    if (!this.successWatcher) {
      const callback = () => {
        this.successWatcher = null
        ack()
      }
      this.successWatcher = global.setTimeout(callback, time)
    }
  }

  /**
   * On failure
   *
   * If we where waiting for a success timeout, it will cancel the wait.
   *
   * An application error (failed authentication, failed subscription) will
   * not trigger a failure (trying to reconnect with the same parameters
   * has no meaning anyways).
   *
   * @param {object} error
   */
  onFailure(error) {
    logger.debug('failure, increase the failure counter of the retry manager')
    this.clearSuccessWatcher()
    this.increaseFailureCounter()
    this.emit('failure', error)
    if (this.shouldEmitError()) this.emit('error', error)
  }

  /**
   * Returns if we reached a level where we need to raise an error
   *
   * @returns {boolean}
   */
  shouldEmitError() {
    return this.retries > 0 && this.retries % this.raiseErrorAfterAttempts == 0
  }

  /**
   * Reset failures counters (do not wait before trying to connect next time)
   */
  reset() {
    logger.debug('reset the retry manager')
    this.clearSuccessWatcher()
    this.retries = 0
    this.wait = 0
  }

  /**
   * Increases the failure counter (wait more before next attempt)
   *
   * @private
   */
  increaseFailureCounter() {
    if (this.retries === 0) {
      // first reconnect should be immediate
      this.wait = 0
    } else if (this.wait === 0) {
      // base value
      this.wait = this.baseWaitAfterFirstFailure
    } else {
      this.wait = Math.min(this.wait * 2, this.maxWaitBetweenRetries)
    }
    this.retries = this.retries + 1
  }

  /**
   * Wait an amount of time before the next attempt (if needed)
   */
  async waitBeforeNextAttempt() {
    logger.debug('waitBeforeNextAttempt', this.wait)
    if (this.wait) {
      await new Promise(resolve => {
        global.setTimeout(resolve, this.wait)
      })
    }
  }
}

MicroEE.mixin(RetryManager)

export default RetryManager
