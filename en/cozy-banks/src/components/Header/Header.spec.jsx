import React from 'react'
import { shallow } from 'enzyme'
import Header from './Header'

describe('Header', () => {
  it(`should display children`, () => {
    expect(shallow(<Header>content</Header>).getElement()).toMatchSnapshot()
  })

  it(`should extend className`, () => {
    expect(
      shallow(<Header className="noPaddingBottom">content</Header>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set position fixed`, () => {
    expect(
      shallow(<Header fixed>content</Header>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color default`, () => {
    expect(
      shallow(<Header color="default">content</Header>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color primary`, () => {
    expect(
      shallow(<Header color="primary">content</Header>).getElement()
    ).toMatchSnapshot()
  })
})
