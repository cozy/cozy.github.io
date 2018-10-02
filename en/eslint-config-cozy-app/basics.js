'use strict'

module.exports = {
  plugins: ['prettier'],
  extends: ['eslint:recommended', 'eslint-config-prettier'],
  parser: 'babel-eslint',
  env: {
    browser: true,
    jest: true,
    node: true,
    es6: true
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false
      }
    ]
  }
}
