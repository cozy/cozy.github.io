import React from 'react'
import { shallow } from 'enzyme'
import Title from './Title'

describe('Title', () => {
  it(`should display children`, () => {
    expect(shallow(<Title>content</Title>).getElement()).toMatchSnapshot()
  })

  it(`should extend className`, () => {
    expect(
      shallow(<Title className="noPaddingBottom">content</Title>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color default`, () => {
    expect(
      shallow(<Title color="default">content</Title>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color primary`, () => {
    expect(
      shallow(<Title color="primary">content</Title>).getElement()
    ).toMatchSnapshot()
  })
})
