import React from 'react'
import { DumbPhoneCard, DumbWebCard, DumbAppCard } from './Card'
import { mount } from 'enzyme'
import { getPlatform } from 'cozy-device-helper'

jest.mock('cozy-device-helper')

const t = key => key

describe('DumbPhoneCard', () => {
  it('should render correctly with number and price', () => {
    const contact = {
      number: '01 23 45 67 89',
      price: '0,06€/min'
    }

    expect(
      mount(<DumbPhoneCard contact={contact} t={t} />).html()
    ).toMatchSnapshot()
  })

  it('should render correctly with only number', () => {
    const contact = {
      number: '01 23 45 67 89'
    }

    expect(
      mount(<DumbPhoneCard contact={contact} t={t} />).html()
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
      mount(<DumbWebCard contact={contact} t={t} />).html()
    ).toMatchSnapshot()
  })
})

describe('DumbAppCard', () => {
  it('should render nothing if the platform does not match with the current device', () => {
    getPlatform.mockReturnValueOnce('ios')

    const contact = { platform: 'android', href: 'http://some.thing' }

    expect(mount(<DumbAppCard contact={contact} t={t} />).html()).toBe(null)
  })

  it('should render correctly if the platform matches with the current device', () => {
    getPlatform.mockReturnValueOnce('ios')

    const contact = { platform: 'ios', href: 'http://some.thing' }
    expect(
      mount(<DumbAppCard contact={contact} t={t} />).html()
    ).toMatchSnapshot()
  })
})
