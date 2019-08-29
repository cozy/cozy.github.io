import { hasParameter } from './qs'

describe('hasParameter', () => {
  const query = { foo: null }

  it('should return true if the parameter exists', () => {
    expect(hasParameter(query, 'foo')).toBe(true)
  })

  it('should return false if the parameter does not exist', () => {
    expect(hasParameter(query, 'bar')).toBe(false)
  })
})
