import flag, {
  prefix,
  getKey,
  getFlag,
  setFlag,
  listFlags,
  resetFlags
} from './flag'

describe('getKey', () => {
  it('should return the right prefixed key', () => {
    expect(getKey('test')).toBe(`${prefix}test`)
    expect(getKey('feature')).toBe(`${prefix}feature`)
  })
})

describe('getFlag', () => {
  beforeEach(() => {
    localStorage.setItem(getKey('test'), true)
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should return the right value', () => {
    expect(getFlag('test')).toBe(true)
  })

  it('should return null if the key does not exist', () => {
    expect(getFlag('not-existing')).toBeNull()
  })

  it('should set the value to null if the key does not exist', () => {
    getFlag('not-existing')

    expect(localStorage.__STORE__[getKey('not-existing')]).toBe('null')
  })
})

describe('setFlag', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('should set the right value to the right key', () => {
    const key = getKey('test')
    expect(localStorage.__STORE__[key]).toBeUndefined()

    setFlag('test', true)
    expect(localStorage.__STORE__[key]).toBe('true')
  })
})

describe('flag', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('should return the requested flag when passed a single parameter', () => {
    localStorage.setItem(getKey('test'), 'true')

    expect(flag('test')).toBe(true)
  })

  it('should set the flag when passed two parameters', () => {
    const key = getKey('test')
    expect(localStorage.__STORE__[key]).toBeUndefined()

    flag('test', true)
    expect(localStorage.__STORE__[key]).toBe('true')
  })
})

describe('listFlags', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('should return all the flag keys', () => {
    const expectedFlags = ['test', 'feature', 'thing']
    expectedFlags.forEach(expectedFlag => setFlag(expectedFlag, true))

    const flags = listFlags()

    expect(flags).toEqual(expectedFlags)
  })
})

describe('resetFlags', () => {
  it('should reset all the flags', () => {
    ;['test', 'feature', 'thing'].forEach(expectedFlag =>
      setFlag(expectedFlag, true)
    )

    expect(listFlags()).toHaveLength(3)

    resetFlags()

    expect(listFlags()).toHaveLength(0)
  })
})
