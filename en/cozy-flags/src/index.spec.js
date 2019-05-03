import flag from '.'

describe('enable', () => {
  afterEach(() => {
    flag.reset()
  })

  it('should do nothing if the parameter is not an array', () => {
    flag.enable('blablabla')
    flag.enable(42)
    flag.enable(true)
    flag.enable({})
    flag.enable()

    expect(flag.list()).toEqual([])
  })

  it('should enable the flags if the parameter is an array', () => {
    const flagsToEnable = ['hello', 'world']
    flag.enable(flagsToEnable)

    expect(flag.list()).toEqual(flagsToEnable)
  })
})
