import React from 'react'
import { shallow } from 'enzyme'
import PageTitle from './PageTitle'

describe('PageTitle', () => {
  it(`should display children`, () => {
    expect(
      shallow(<PageTitle>content</PageTitle>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color default`, () => {
    expect(
      shallow(<PageTitle color="default">content</PageTitle>).getElement()
    ).toMatchSnapshot()
  })

  it(`should set color primary`, () => {
    expect(
      shallow(<PageTitle color="primary">content</PageTitle>).getElement()
    ).toMatchSnapshot()
  })
})
