import React from 'react'
import { shallow } from 'enzyme'
import Title from './Title'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

describe('Title', () => {
  it(`should display children`, () => {
    expect(shallow(<Title>content</Title>).getElement()).toMatchSnapshot()
  })

  it(`should extend className`, () => {
    expect(
      shallow(<Title className="noPaddingBottom">content</Title>).getElement()
    ).toMatchSnapshot()
  })

  it(`should handle theme`, () => {
    expect(
      shallow(
        <CozyTheme variant="inverted">
          <Title>content</Title>
        </CozyTheme>
      ).getElement()
    ).toMatchSnapshot()
  })
})
