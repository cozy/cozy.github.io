import LateHealthReimbursement from './LateHealthReimbursement'

describe('LateHealthReimbursement', () => {
  it('should return the good push content', () => {
    ;['fr', 'en'].forEach(lang => {
      const localeStrings = require(`../../locales/${lang}.json`)
      const { initTranslation } = require('cozy-ui/react/I18n/translation')
      const translation = initTranslation(lang, () => localeStrings)
      const t = translation.t.bind(translation)

      const notification = new LateHealthReimbursement({
        t,
        data: {},
        cozyClient: { _url: 'http://cozy.tools:8080' },
        value: 20
      })

      const oneTransaction = new Array(1)
      const twoTransactions = new Array(2)

      expect(notification.getPushContent(oneTransaction)).toMatchSnapshot()
      expect(notification.getPushContent(twoTransactions)).toMatchSnapshot()
    })
  })
})
