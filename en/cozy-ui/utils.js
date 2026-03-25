import get from 'lodash/get'

import translations from './fixtures/en.json'

export const t = path => {
  return get(translations, path)
}
