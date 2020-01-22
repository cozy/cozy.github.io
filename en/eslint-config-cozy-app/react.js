'use strict'

const basics = require('./basics')

module.exports = {
  plugins: basics.plugins.concat(['react-hooks']),
  extends: basics.extends.concat(['plugin:react/recommended']),
  parser: basics.parser,
  parserOptions: { ecmaFeatures: { jsx: true } },
  env: basics.env,
  settings: { react: { version: 'latest' } },
  rules: Object.assign({}, basics.rules, {
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  })
}
