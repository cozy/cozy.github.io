import {
  buildRedirectionURL,
  isFramedByAllowedOrigins,
  pickService,
  pickSizes,
  removeQueryString
} from './helpers'

describe('pickSizes', () => {
  it('keeps the sizes of the element, as pixels', () => {
    expect(
      pickSizes({
        width: 300,
        height: '200px',
        maxWidth: '400',
        maxHeight: 0.5
      })
    ).toEqual({ width: 300, height: 200, maxWidth: 400, maxHeight: 0.5 })
  })

  it('leaves out the other properties and the sizes out of range', () => {
    expect(
      pickSizes({
        position: 'fixed',
        zIndex: 2147483647,
        cssText: 'position: fixed',
        width: -1,
        height: 10001,
        maxWidth: '100%',
        maxHeight: NaN
      })
    ).toEqual({})
    expect(pickSizes({ width: Infinity, height: '' })).toEqual({})
  })

  it('takes what is not an object as no size', () => {
    expect(pickSizes(undefined)).toEqual({})
    expect(pickSizes(null)).toEqual({})
    expect(pickSizes('300')).toEqual({})
  })
})

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

describe('isFramedByAllowedOrigins', () => {
  const CHAT = 'https://chat.example.com'
  const CHAT_SHELL = 'https://alice-chat.example.com'
  const EVIL = 'https://evil.example'

  it('allows a service framed by the client app, in its cozy shell or not', () => {
    expect(isFramedByAllowedOrigins([CHAT, CHAT_SHELL], [CHAT])).toBe(true)
    expect(
      isFramedByAllowedOrigins([CHAT, CHAT_SHELL], [CHAT, CHAT_SHELL])
    ).toBe(true)
  })

  it('refuses an ancestor the intent does not allow', () => {
    expect(isFramedByAllowedOrigins([CHAT, CHAT_SHELL], [CHAT, EVIL])).toBe(
      false
    )
    expect(isFramedByAllowedOrigins([CHAT], [EVIL])).toBe(false)
    expect(isFramedByAllowedOrigins([CHAT], [])).toBe(false)
  })

  it('refuses an intent without frameAncestors', () => {
    expect(isFramedByAllowedOrigins(undefined, [CHAT])).toBe(false)
    expect(isFramedByAllowedOrigins(null, null)).toBe(false)
  })

  it('refuses frameAncestors given in another shape', () => {
    expect(isFramedByAllowedOrigins(CHAT, [CHAT])).toBe(false)
    expect(isFramedByAllowedOrigins([CHAT, 42], [CHAT])).toBe(false)
    expect(isFramedByAllowedOrigins([`${CHAT}/`], [CHAT])).toBe(false)
  })

  it('leaves the handshake alone to guard when the browser does not tell the ancestors (Firefox before 148)', () => {
    expect(isFramedByAllowedOrigins([CHAT], null)).toBe(true)
  })
})

describe('pickService', () => {
  const intentWith = (...hrefs) => ({
    attributes: { services: hrefs.map(href => ({ href })) }
  })

  it('picks the first service', () => {
    expect(
      pickService(intentWith('https://a.test/intent', 'https://b.test/intent'))
    ).toEqual({ href: 'https://a.test/intent' })
  })

  it('refuses a service that is not a web page', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,x', 'nope']) {
      expect(() => pickService(intentWith(href))).toThrow(
        'The service is not a web page'
      )
    }
  })

  it('throws without a service', () => {
    expect(() => pickService(intentWith())).toThrow('Unable to find a service')
  })
})
