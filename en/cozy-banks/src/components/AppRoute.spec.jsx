import AppRoute from './AppRoute'
import React from 'react'
import { Route } from 'react-router'

const NewComponent = () => <div>New component</div>

describe('App route', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should be a function returning a route', () => {
    const route = AppRoute()
    expect(route).toMatchSnapshot()
  })

  it('should have renderExtraRoutes', () => {
    jest
      .spyOn(AppRoute, 'renderExtraRoutes')
      .mockReturnValue(<Route component={NewComponent} path="extra-route" />)
    const route = AppRoute()
    expect(route).toMatchSnapshot()
  })
})
