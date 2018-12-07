export default function testFlagAPI(flag) {
  afterEach(() => {
    flag.reset()
  })

  describe('flag', () => {
    it('should return the requested flag when passed a single parameter', () => {
      flag('test', true)
      expect(flag('test')).toBe(true)
    })

    it('should set the flag when passed two parameters', () => {
      expect(flag('test')).toBeNull()

      flag('test', true)
      expect(flag('test')).toBe(true)
    })
  })

  describe('listFlags', () => {
    it('should return all the flag keys', () => {
      const expectedFlags = ['test', 'feature', 'thing']
      expectedFlags.forEach(expectedFlag => flag(expectedFlag, true))

      const flags = flag.list()

      expect(flags).toEqual(expectedFlags)
    })
  })

  describe('resetFlags', () => {
    it('should reset all the flags', () => {
      ;['test', 'feature', 'thing'].forEach(expectedFlag =>
        flag(expectedFlag, true)
      )

      expect(flag.list()).toHaveLength(3)

      flag.reset()

      expect(flag.list()).toHaveLength(0)
    })
  })
}
