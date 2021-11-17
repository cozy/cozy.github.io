/* CLI used in development to generate emails from template and data */

jest.mock('./helpers', () => ({
  ...jest.requireActual('./helpers'),
  getCurrentDate: () => new Date('05-07-2019')
}))

const { EMAILS, buildNotificationAttributes } = require('./common-test')

describe('emails', () => {
  for (const lang of ['en', 'fr']) {
    for (let templateName of Object.keys(EMAILS)) {
      const loweredTemplateName =
        templateName[0].toLowerCase() + templateName.slice(1)
      it(`should render ${loweredTemplateName} in ${lang}`, async () => {
        const attrs = await buildNotificationAttributes(templateName, lang)
        expect(attrs.content_html).toMatchSnapshot()
      })
    }
  }
})
