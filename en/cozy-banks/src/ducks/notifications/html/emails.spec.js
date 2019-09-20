/* CLI used in development to generate emails from template and data */

jest.mock('./utils', () => {
  const originalUtils = jest.requireActual('./utils')
  return {
    ...originalUtils,
    getCurrentDate: () => new Date('05-07-2019')
  }
})

const { EMAILS, renderTemplate } = require('./common-test')

describe('emails', () => {
  for (const lang of ['en', 'fr']) {
    for (const templateName of Object.keys(EMAILS)) {
      it(`should render ${templateName} in ${lang}`, async () => {
        const renderedTemplate = await renderTemplate(templateName, lang)
        expect(renderedTemplate).toMatchSnapshot()
      })
    }
  }
})
