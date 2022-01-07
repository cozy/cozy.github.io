'use strict'

module.exports = {
  plugins: ['prettier', 'promise'],
  extends: [
    'eslint:recommended',
    'eslint-config-prettier',
    'plugin:promise/recommended'
  ],
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    jest: true,
    node: true,
    es6: true
  },
  rules: {
    'no-console': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        trailingComma: 'none',
        arrowParens: 'avoid'
      }
    ],
    'no-param-reassign': 'warn',
    'spaced-comment': ['error', 'always']
  }
}
