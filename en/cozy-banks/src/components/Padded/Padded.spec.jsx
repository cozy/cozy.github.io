import React from 'react'
import { shallow } from 'enzyme'
import { Padded } from './Padded'

describe('Padded', () => {
  it(`should display children`, () => {
    expect(shallow(<Padded>content</Padded>).getElement()).toMatchSnapshot()
  })

  it(`should extend className`, () => {
    expect(
      shallow(<Padded className="noPaddingBottom">content</Padded>).getElement()
    ).toMatchSnapshot()
  })
})
