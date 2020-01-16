import React from 'react'
import { mount } from 'enzyme'
import { DumbPinAuth as PinAuth, RawPinAuth } from './PinAuth'
import AppLike from 'test/AppLike'

describe('pin auth', () => {
  const pinSetting = {
    pin: '123456'
  }

  const setup = ({ pinSetting }) => {
    const root = mount(
      <AppLike>
        <PinAuth onSuccess={jest.fn()} pinSetting={{ data: pinSetting }} />
      </AppLike>
    )
    return { root, pinAuth: root.find(RawPinAuth) }
  }

  it('should render correctly', () => {
    const { root } = setup({ pinSetting })
    expect(root.find('PinButton').length).toBe(12)
  })

  it('should render a paragraph on fingerprint if activated', () => {
    const { root } = setup({ pinSetting: { ...pinSetting, fingerprint: true } })
    expect(root.find('DumbFingerprintParagraph').length).toBe(1)
  })

  it('should render a paragraph on fingerprint if activated', () => {
    const { root } = setup({
      pinSetting: { ...pinSetting, fingerprint: false }
    })
    expect(root.find('DumbFingerprintParagraph').length).toBe(0)
  })

  describe('auth success', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should call onSuccess with a delay for keyboard method', () => {
      const { pinAuth } = setup({
        pinSetting: { ...pinSetting, fingerprint: true }
      })
      pinAuth.instance().handleAuthSuccess('keyboard')
      expect(pinAuth.props().onSuccess).not.toHaveBeenCalled()
      jest.runAllTimers()
      expect(pinAuth.props().onSuccess).toHaveBeenCalled()
    })

    it('should call onSuccess without a delay for biometric method', () => {
      const { pinAuth } = setup({
        pinSetting: { ...pinSetting, fingerprint: true }
      })
      pinAuth.instance().handleAuthSuccess('biometric')
      expect(pinAuth.props().onSuccess).toHaveBeenCalled()
    })
  })
})
