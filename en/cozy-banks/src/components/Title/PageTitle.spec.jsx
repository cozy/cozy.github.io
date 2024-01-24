import React from 'react'
import { shallow } from 'enzyme'
import PageTitle from './PageTitle'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints')

describe('PageTitle', () => {
  it(`should display children on mobile`, () => {
    useBreakpoints.mockReturnValue({ isMobile: true })
    expect(
      shallow(<PageTitle>content</PageTitle>).getElement()
    ).toMatchSnapshot()
  })

  it(`should display children on desktop`, () => {
    useBreakpoints.mockReturnValue({ isMobile: false })
    expect(
      shallow(<PageTitle>content</PageTitle>).getElement()
    ).toMatchSnapshot()
  })
})
