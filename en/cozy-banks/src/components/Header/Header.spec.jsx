import React from 'react'
import { mount } from 'enzyme'
import Header from './Header'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

describe('Header', () => {
  const setup = element => mount(element).html()

  it(`should display children`, () => {
    expect(setup(<Header>content</Header>)).toMatchSnapshot()
  })

  it(`should extend className`, () => {
    expect(
      setup(<Header className="noPaddingBottom">content</Header>)
    ).toMatchSnapshot()
  })

  it(`should set position fixed`, () => {
    expect(setup(<Header fixed>content</Header>)).toMatchSnapshot()
  })

  it(`should set theme default`, () => {
    expect(setup(<Header theme="normal">content</Header>)).toMatchSnapshot()
  })

  it(`should set theme inverted`, () => {
    expect(setup(<Header theme="inverted">content</Header>)).toMatchSnapshot()
  })

  it('should set cozy theme', () => {
    const Component = () => {
      const { variant } = useCozyTheme()
      return <>{variant}</>
    }
    expect(
      mount(
        <Header theme="inverted">
          <Component />
        </Header>
      ).text()
    ).toBe('inverted')
  })
})
