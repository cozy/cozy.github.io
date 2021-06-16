export const DEFAULT_CURRENCY_SYMBOL = '€'
const CURRENCY_TO_SYMBOL = {
  EUR: DEFAULT_CURRENCY_SYMBOL,
  USD: '$',
  GBP: '£'
}

export const getCurrencySymbol = currency => {
  if (typeof currency === 'string') {
    return CURRENCY_TO_SYMBOL[currency] || currency
  }

  if (typeof currency === 'object') {
    // currency :
    // { crypto, datetime, id, marketcap, name, precision, prefix, symbol }
    return currency
      ? currency.symbol ||
          CURRENCY_TO_SYMBOL[currency.id] ||
          DEFAULT_CURRENCY_SYMBOL
      : DEFAULT_CURRENCY_SYMBOL
  }

  return DEFAULT_CURRENCY_SYMBOL
}
