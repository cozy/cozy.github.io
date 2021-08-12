import { getLanguageFromDOM } from './lang'

describe('lang', () => {
  it('should return "en" locale as a default', () => {
    const lang = getLanguageFromDOM()
    expect(lang).toEqual('en')
  })

  it('should rely on the data-cozy field if it exists', () => {
    const cozyData = JSON.stringify({ locale: 'fr' })
    document.body.innerHTML = `<div role="application" data-cozy=${cozyData}></div>`

    const lang = getLanguageFromDOM()
    expect(lang).toEqual('fr')
  })
})
