import { getCurrencySymbol } from './currencySymbol'

describe('getCurrencySymbol', () => {
  it('should return default currency symbol', () => {
    expect(getCurrencySymbol()).toBe('€')
  })
  it('should return symbol from string', () => {
    expect(getCurrencySymbol('EUR')).toBe('€')
    expect(getCurrencySymbol('€')).toBe('€')
    expect(getCurrencySymbol('USD')).toBe('$')
    expect(getCurrencySymbol('$')).toBe('$')
    expect(getCurrencySymbol('GBP')).toBe('£')
    expect(getCurrencySymbol('£')).toBe('£')
  })
  it('should return symbol from object', () => {
    expect(getCurrencySymbol({ symbol: '€' })).toBe('€')
    expect(getCurrencySymbol({ symbol: '$' })).toBe('$')
    expect(getCurrencySymbol({ symbol: '£' })).toBe('£')
    expect(getCurrencySymbol({ id: 'EUR' })).toBe('€')
    expect(getCurrencySymbol({ id: 'USD' })).toBe('$')
    expect(getCurrencySymbol({ id: 'GBP' })).toBe('£')
    expect(getCurrencySymbol({})).toBe('€')
  })
})
