import flag, { enableFlags } from '.'

describe('enableFlags', () => {
  afterEach(() => {
    flag.reset()
  })

  it('should do nothing if the parameter is not an array', () => {
    enableFlags('blablabla')
    enableFlags(42)
    enableFlags(true)
    enableFlags({})
    enableFlags()

    expect(flag.list()).toEqual([])
  })

  it('should enable the flags if the parameter is an array', () => {
    const flagsToEnable = ['hello', 'world']
    enableFlags(flagsToEnable)

    expect(flag.list()).toEqual(flagsToEnable)
  })
})
