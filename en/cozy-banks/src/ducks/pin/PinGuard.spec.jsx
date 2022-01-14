import { mount } from 'enzyme'
import React from 'react'
import CozyClient from 'cozy-client'
import { DumbPinGuard as PinGuard } from './PinGuard'
import AppLike from 'test/AppLike'
import PinAuth from './PinAuth'
import { pinSettingStorage, lastInteractionStorage } from './storage'

jest.mock('./storage', () => ({
  pinSettingStorage: {
    load: jest.fn(),
    save: jest.fn()
  },
  lastInteractionStorage: {
    load: jest.fn(),
    save: jest.fn()
  }
}))

jest.mock('./PinAuth', () => () => null)

const PIN_CODE = '111111'

const PIN_DOC = {
  data: {
    pin: PIN_CODE
  }
}

const pinAuthIsShown = root => root.find(PinAuth).length === 1

describe('PinGuard', () => {
  const App = () => <div>App</div>

  const setup = ({ pinSetting }) => {
    const client = new CozyClient({})
    client.query = jest.fn()
    const root = mount(
      <AppLike client={client}>
        <PinGuard timeout={10 * 1000} pinSetting={pinSetting}>
          <App />
        </PinGuard>
      </AppLike>
    )
    return { root }
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should protect its children if there is a pinSetting doc', () => {
    jest.useFakeTimers()
    const { root } = setup({
      pinSetting: PIN_DOC
    })

    expect(root.children).toHaveLength(1)
    expect(root.find(App)).toHaveLength(0)
    expect(pinAuthIsShown(root)).toBe(true)
    jest.runAllTimers()
    root.update()
    expect(pinAuthIsShown(root)).toBe(true)
  })

  it('should do nothing if there isnt a pinSetting doc', () => {
    jest.useFakeTimers()
    const { root } = setup({ pinSetting: { data: null } })
    expect(pinAuthIsShown(root)).toBe(false)
    jest.runAllTimers()
    root.update()
    expect(pinAuthIsShown(root)).toBe(false)
  })

  it('should not show PinAuth if pin entered successfully', () => {
    const { root } = setup({ pinSetting: PIN_DOC })
    jest.runAllTimers()
    root.update()
    expect(pinAuthIsShown(root)).toBe(true)
    root.find(PinAuth).props().onSuccess()

    root.update()
    expect(pinAuthIsShown(root)).toBe(false)
  })

  it('should show PinAuth, eventually, after a success', () => {
    const { root } = setup({ pinSetting: PIN_DOC })
    jest.runAllTimers()
    root.update()
    expect(pinAuthIsShown(root)).toBe(true)
    root.find(PinAuth).props().onSuccess()
    jest.runAllTimers()
    root.update()
    expect(pinAuthIsShown(root)).toBe(true)
  })

  it('should remember last interaction', () => {
    const { root } = setup({ pinSetting: PIN_DOC })
    jest.spyOn(Date, 'now').mockReturnValue(1337)
    const instance = root.find(PinGuard).instance()
    jest.spyOn(instance, 'setState')
    expect(pinAuthIsShown(root)).toBe(true)

    root.find(PinAuth).props().onSuccess()
    root.update()

    expect(pinAuthIsShown(root)).toBe(false)
    instance.handleInteraction()
    expect(instance.setState).toHaveBeenCalledWith({
      last: 1337
    })
    expect(lastInteractionStorage.save).toHaveBeenCalledWith(1337)
  })

  it('should get last interaction from localstorage', () => {
    lastInteractionStorage.load.mockReturnValue(1337)
    const { root } = setup({ pinSetting: PIN_DOC })
    expect(pinAuthIsShown(root)).toBe(true)
  })

  describe('cached pin doc', () => {
    it('should not show PinAuth if pinDoc still fetching and no cached is present', () => {
      pinSettingStorage.load.mockReturnValue(null)
      const { root } = setup({
        pinSetting: { ...PIN_DOC, fetchStatus: 'loading' }
      })
      expect(pinAuthIsShown(root)).toBe(false)
    })

    it('should use cached pin doc if pin doc is fetching', () => {
      lastInteractionStorage.load.mockReturnValue(1337)
      pinSettingStorage.load.mockReturnValue(PIN_DOC.data)
      const { root } = setup({
        pinSetting: { ...PIN_DOC, fetchStatus: 'loading' }
      })
      expect(pinAuthIsShown(root)).toBe(true)
    })
  })

  describe('timeout management', () => {
    it('should restart timeout after success', () => {
      const { root } = setup({
        pinSetting: PIN_DOC
      })
      const instance = root.find(PinGuard).instance()
      jest.spyOn(instance, 'restartTimeout')
      instance.handlePinSuccess()
      expect(instance.restartTimeout).toHaveBeenCalled()
    })

    describe('handle interaction', () => {
      describe('when pin hidden', () => {
        it('should restart timeout after interaction', () => {
          jest.useFakeTimers()
          const { root } = setup({
            pinSetting: PIN_DOC
          })
          jest.runAllTimers()
          root.update()
          root.find(PinAuth).props().onSuccess()
          root.update()

          expect(root.find(PinGuard).state().showPin).toBe(false)

          const instance = root.find(PinGuard).instance()
          jest.spyOn(instance, 'restartTimeout')
          instance.handleInteraction()
          expect(instance.restartTimeout).toHaveBeenCalled()
        })
      })

      describe('when pin showing', () => {
        it('should restart timeout after interaction', () => {
          jest.useFakeTimers()
          const { root } = setup({
            pinSetting: PIN_DOC
          })
          jest.runAllTimers()
          root.update()

          expect(root.find(PinGuard).state().showPin).toBe(true)

          const instance = root.find(PinGuard).instance()
          jest.spyOn(instance, 'restartTimeout')
          instance.handleInteraction()
          expect(instance.restartTimeout).not.toHaveBeenCalled()
        })
      })
    })
  })
})
