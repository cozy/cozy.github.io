import { setupLocale, timeFormat } from './d3'

describe('setupLocale', () => {
  it('should work if locale is loaded', () => {
    expect(() => setupLocale('fr')).not.toThrow()
    const formatTime = timeFormat('%B %d, %Y')
    expect(formatTime(new Date(2020, 5, 1))).toBe('juin 01, 2020')
  })

  it('should not crash if the locale is not loaded', () => {
    expect(() => setupLocale('zh')).not.toThrow()
    const formatTime = timeFormat('%B %d, %Y')
    expect(formatTime(new Date(2020, 5, 1))).toBe('June 01, 2020')
  })
})
