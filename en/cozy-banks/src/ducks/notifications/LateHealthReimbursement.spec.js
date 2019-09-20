import LateHealthReimbursement from './LateHealthReimbursement'

describe('LateHealthReimbursement', () => {
  const setup = ({ lang }) => {
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
    return { notification }
  }

  ;['fr', 'en'].forEach(lang => {
    it(`should return push content for lang ${lang}`, () => {
      const { notification } = setup({ lang })
      const oneTransaction = new Array(1)
      const twoTransactions = new Array(2)

      expect(
        notification.getPushContent({ transactions: oneTransaction })
      ).toMatchSnapshot()
      expect(
        notification.getPushContent({ transactions: twoTransactions })
      ).toMatchSnapshot()
    })
  })
})
