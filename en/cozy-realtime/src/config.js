import defaultLogger from './logger'

const ms = 1
const sec = 1000
const min = sec * 60

/**
 * When trying to reconnect, do not increase the waiting time
 * indefinitely. This is the time one may wait between two
 * attempts.
 *
 * @type {integer} time to wait in millisecond
 * @private
 */
export const maxWaitBetweenRetries = 5 * min

/**
 * When reconnecting after an error or an unsuccessful attempt, waits
 * an amount of time before a new retry. This time will double
 * at each attempt until one is successful or the navigator send an
 * 'online' event.
 *
 * @type {integer} time to wait in millisecond
 * @private
 */
export const baseWaitAfterFirstFailure = 128 * ms

/**
 * If a connection is open for this amount of time with no error
 * it is marked as successful and the exponential backoff is reseted
 *
 * @type {integer} time to wait in millisecond
 * @private
 */
export const timeBeforeSuccessful = 1.2 * sec

/**
 * Raise an error after a fixed number of attempt
 *
 * @type {boolean}
 * @private
 */
export const raiseErrorAfterAttempts = 8

/**
 * If one subscribe multiple times to the exact same event with the exact
 * same handler, should we call the handler multiple times for each event?
 * eventWhat to do if someone ask multiple times for the same subscription?
 *
 * If you modify this value, please double check that the tests are ok and
 * start a real validation procedure. This is given without any garantee.
 *
 * @type {boolean}
 * @private
 */
export const allowDoubleSubscriptions = true

/**
 * If one subscribe multiple times to the exact same event with the exact
 * same handler, should we unsubscribe all the corresponding handlers on
 * the first call to unsubscribe or should we ask for multiple calls
 * to unsubscribe?
 *
 * If you modify this value, please double check that the tests are ok and
 * start a real validation procedure. This is given without any garantee.
 *
 * @type {boolean}
 * @private
 */
export const requireDoubleUnsubscriptions = true

/**
 * If one subscribe multiple times to the exact same event with the exact
 * same handler, this function is called. You are welcome to add any
 * log or warning you wish, or even to throw an exception.
 * This function get a subscription object in parameter. This object has
 * the form { eventName, type, id, handler } where id is optional.
 *
 * @type {Function}
 * @private
 */
export const onDoubleSubscriptions = (
  subscription,
  { logger = defaultLogger } = {}
) => {
  logger.warn('Double subscription for ', subscription)
  if (allowDoubleSubscriptions) {
    logger.info('The handler may be called twice for the same event!')
    logger.info('Remember to call one `unsubscribe` for each `subscribe`')
  } else {
    logger.info('The handler will only be called once')
    if (requireDoubleUnsubscriptions) {
      logger.info('Remember to call one `unsubscribe` for each `subscribe`')
    } else {
      logger.info('`unsubscribe` will remove all similar subscriptions')
    }
  }
}

/**
 * @typedef {'CREATED'|UPDATED'|DELETED'|'NOTIFIED'|'error'} EventName
 */
/**
 * Possible values for the `event` property in Realtime
 *
 * @type  {EventName}
 */
export const eventNames = ['CREATED', 'UPDATED', 'DELETED', 'NOTIFIED', 'error']
