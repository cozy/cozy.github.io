import React from 'react'
import { DumbPhoneCard, DumbWebCard, DumbAppCard } from './Card'
import { mount } from 'enzyme'
import { getPlatform } from 'cozy-device-helper'
import { TestI18n } from 'test/AppLike'

jest.mock('cozy-device-helper')

describe('DumbPhoneCard', () => {
  it('should render correctly with number and price', () => {
    const contact = {
      number: '01 23 45 67 89',
      price: '0,06€/min'
    }

    expect(
      mount(
        <TestI18n>
          <DumbPhoneCard contact={contact} />
        </TestI18n>
      ).html()
    ).toMatchSnapshot()
  })

  it('should render correctly with only number', () => {
    const contact = {
      number: '01 23 45 67 89'
    }

    expect(
      mount(
        <TestI18n>
          <DumbPhoneCard contact={contact} />
        </TestI18n>
      ).html()
    ).toMatchSnapshot()
  })
})

describe('DumbWebCard', () => {
  it('should render correctly', () => {
    const contact = {
      href: 'https://ameli.fr',
      action: 'sendCareSheet'
    }

    expect(
      mount(
        <TestI18n>
          <DumbWebCard contact={contact} />
        </TestI18n>
      ).html()
    ).toMatchSnapshot()
  })
})

describe('DumbAppCard', () => {
  it('should render nothing if the platform does not match with the current device', () => {
    getPlatform.mockReturnValueOnce('ios')

    const contact = { platform: 'android', href: 'http://some.thing' }

    expect(
      mount(
        <TestI18n>
          <DumbAppCard contact={contact} />
        </TestI18n>
      ).html()
    ).toBe('')
  })

  it('should render correctly if the platform matches with the current device', () => {
    getPlatform.mockReturnValueOnce('ios')

    const contact = { platform: 'ios', href: 'http://some.thing' }
    expect(
      mount(
        <TestI18n>
          <DumbAppCard contact={contact} />
        </TestI18n>
      ).html()
    ).toMatchSnapshot()
  })
})
