import en from 'locales/en.json'
import fr from 'locales/fr.json'
import Polyglot from 'node-polyglot'
import parseCozyData from 'utils/cozyData'
const locales = { en, fr }

export const getLanguageFromDOM = rootOption => {
  const root = rootOption || document.querySelector('[role=application]')
  return root?.dataset?.cozy ? parseCozyData(root).locale : 'en'
}

/**
 * Used to translate strings
 *
 * To be used when not in React context, in React
 * context, the t function comes from the context
 */
export const getT = option => {
  const lang = getLanguageFromDOM(option)
  const polyglot = new Polyglot({
    lang: lang,
    phrases: locales[lang]
  })
  return polyglot.t.bind(polyglot)
}

export const lang = process.env.COZY_LOCALE || 'en'
export const dictRequire = lang => require(`locales/${lang}`)

export const enLocaleOption = {
  dataset: { cozy: JSON.stringify({ locale: 'en' }) }
}
