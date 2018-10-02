'use strict'

const basics = require('./basics')

module.exports = {
  plugins: basics.plugins,
  extends: basics.extends.concat(['plugin:react/recommended']),
  parser: basics.parser,
  parserOptions: { ecmaFeatures: { jsx: true } },
  env: basics.env,
  rules: Object.assign({}, basics.rules, {
    'react/prop-types': 0
  })
}
