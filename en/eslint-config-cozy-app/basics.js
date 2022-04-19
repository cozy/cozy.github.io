'use strict'

module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'eslint-config-prettier',
    'plugin:promise/recommended'
  ],
  parser: '@babel/eslint-parser',
  plugins: ['prettier', 'promise'],
  rules: {
    'no-console': 'error',
    'no-param-reassign': 'warn',
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        endOfLine: 'auto',
        semi: false,
        singleQuote: true,
        trailingComma: 'none'
      }
    ],
    'spaced-comment': ['error', 'always', { block: { exceptions: ['*'] } }]
  }
}
