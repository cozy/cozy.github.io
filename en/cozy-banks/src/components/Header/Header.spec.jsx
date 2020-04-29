import React from 'react'
import { mount } from 'enzyme'
import Header from './Header'
import useTheme from '../useTheme'

describe('Header', () => {
  const setup = element => mount(element).find('div')

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
    expect(setup(<Header theme="default">content</Header>)).toMatchSnapshot()
  })

  it(`should set theme primary`, () => {
    expect(setup(<Header theme="primary">content</Header>)).toMatchSnapshot()
  })

  it('should set cozy theme', () => {
    const Component = () => {
      const theme = useTheme()
      return <>{theme}</>
    }
    expect(
      mount(
        <Header theme="primary">
          <Component />
        </Header>
      ).text()
    ).toBe('primary')
  })
})
