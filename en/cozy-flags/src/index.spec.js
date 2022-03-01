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
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    const flagsToEnable = ['hello', 'world', 'a']
    flag.enable(flagsToEnable)

    expect(flag.list()).toEqual(['a', 'hello', 'world'])

    expect(consoleSpy).toHaveBeenCalledWith(
      'flags.enable: Deprecation warning: prefer to use an object { flag1: true, flag2: true } instead of an array when using flags.enable'
    )
    consoleSpy.mockRestore()
  })

  it('should not log when called with empty array', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    flag([])
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
