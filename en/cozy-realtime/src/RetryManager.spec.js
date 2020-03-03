import times from 'lodash/times'

import RetryManager from './RetryManager'
import { raiseErrorAfterAttempts, timeBeforeSuccessful } from './config'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

describe('RetryManager', () => {
  describe('waitBeforeNextAttempt', () => {
    it('returns a promise', () => {
      const retry = new RetryManager()
      const promise = retry.waitBeforeNextAttempt()
      expect(promise).toBeInstanceOf(Promise)
    })

    it('resolves instantly at first time', async () => {
      const retry = new RetryManager()
      const before = new Date()
      await retry.waitBeforeNextAttempt()
      const after = new Date()
      expect(after - before).toBeLessThan(100)
    })

    it('makes wait some time after a few failures', async () => {
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      const before = new Date()
      await retry.waitBeforeNextAttempt()
      const after = new Date()
      expect(after - before).toBeGreaterThan(100)
    })
  })

  describe('reset', () => {
    it('allows the wait to go back to zero', async () => {
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.reset()
      const before = new Date()
      await retry.waitBeforeNextAttempt()
      const after = new Date()
      expect(after - before).toBeLessThan(100)
    })

    it('makes sure we reset the counter of failures', () => {
      const retry = new RetryManager()
      times(raiseErrorAfterAttempts, () => retry.onFailure())
      expect(retry.shouldEmitError()).toBeTruthy()
      retry.reset()
      expect(retry.shouldEmitError()).toBeFalsy()
    })

    it('stops the success watcher', async () => {
      const retry = new RetryManager()
      const success = jest.fn()
      retry.on('success', success)
      retry.onSuccess()
      retry.reset()
      await sleep(timeBeforeSuccessful + 100)
      expect(success).not.toHaveBeenCalled()
    })
  })

  describe('shouldEmitError', () => {
    it('is falsy for the first attempts', () => {
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      expect(retry.shouldEmitError()).toBeFalsy()
    })

    it('is truthy when we reach the exact error level', () => {
      const retry = new RetryManager()
      times(raiseErrorAfterAttempts, () => retry.onFailure())
      expect(retry.shouldEmitError()).toBeTruthy()
    })
  })

  describe('onFailure', () => {
    it('inscreases the waiting time', async () => {
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      const before = new Date()
      await retry.waitBeforeNextAttempt()
      const after = new Date()
      expect(after - before).toBeGreaterThan(100)
    })

    it('makes us reach the error level', () => {
      const retry = new RetryManager()
      times(raiseErrorAfterAttempts, () => retry.onFailure())
      expect(retry.shouldEmitError()).toBeTruthy()
    })

    it('stops the success watcher', async () => {
      const retry = new RetryManager()
      const success = jest.fn()
      retry.on('success', success)
      retry.onSuccess()
      retry.onFailure()
      await sleep(timeBeforeSuccessful + 100)
      expect(success).not.toHaveBeenCalled()
    })
  })

  describe('onSuccess', () => {
    it('starts the success watcher', async () => {
      const retry = new RetryManager()
      const success = jest.fn()
      retry.on('success', success)
      retry.onSuccess()
      await sleep(timeBeforeSuccessful + 100)
      expect(success).toHaveBeenCalled()
    })

    it('allows the wait to go back to zero', async () => {
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onSuccess()
      await sleep(timeBeforeSuccessful + 100)
      const before = new Date()
      await retry.waitBeforeNextAttempt()
      const after = new Date()
      expect(after - before).toBeLessThan(100)
    })

    it('makes sure we reset the counter of failures', async () => {
      const retry = new RetryManager()
      times(raiseErrorAfterAttempts, () => retry.onFailure())
      expect(retry.shouldEmitError()).toBeTruthy()
      retry.onSuccess()
      await sleep(timeBeforeSuccessful + 100)
      expect(retry.shouldEmitError()).toBeFalsy()
    })
  })

  describe('stopCurrentAttemptWaitingTime', () => {
    it('stop the waiting time', async () => {
      const handler = jest.fn()
      const retry = new RetryManager()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.onFailure()
      retry.waitBeforeNextAttempt().then(handler)
      retry.stopCurrentAttemptWaitingTime()
      await sleep(25)
      expect(handler).toHaveBeenCalled()
    })
  })
})
