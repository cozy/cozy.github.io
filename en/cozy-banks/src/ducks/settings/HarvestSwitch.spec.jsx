import { routeToRegExp, extractParameters } from './HarvestSwitch'

describe('helpers', () => {
  it('should work', () => {
    const route = '/accounts/:accountId/edit'
    const fragment = '/accounts/deadbeef/edit'
    const rx = routeToRegExp(route)
    expect(Array.from(rx.exec(fragment))).toEqual([
      '/accounts/deadbeef/edit',
      'deadbeef',
      undefined
    ])
    expect(extractParameters(rx, fragment)).toEqual(['deadbeef', null])
  })
})
