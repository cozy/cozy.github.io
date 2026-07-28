import { buildRedirectionURL, removeQueryString } from './helpers'

describe('[Interapp] helpers', () => {
  it('should have a function to remove query string', () => {
    expect(removeQueryString('test?toRemove')).toEqual('test')
    expect(removeQueryString('test?toRemove#why')).toEqual('test#why')
  })

  it('should have a function to build Redirection URL', () => {
    const url = 'test'
    const data = {
      params: 'ok',
      unnusedFunction: function (p) {
        return p
      }
    }
    expect(buildRedirectionURL(url, data)).toEqual('test?params=ok')
  })
})
