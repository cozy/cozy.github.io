import {
  buildRedirectionURL,
  isFramedByAllowedOrigins,
  removeQueryString
} from './helpers'

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
