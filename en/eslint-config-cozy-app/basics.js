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
  plugins: ['prettier', 'promise', 'jest', 'import'],
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
    'spaced-comment': ['error', 'always', { block: { exceptions: ['*'] } }],
    'jest/no-focused-tests': 'error',
    'jest/no-disabled-tests': 'warn',
    'import/order': [
      'warn',
      {
        alphabetize: { order: 'asc' },
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index']
        ],
        pathGroups: [
          {
            pattern: '{cozy-*,cozy-*/**}',
            group: 'external',
            position: 'after'
          },
          {
            pattern: '**/*.styles',
            group: 'index',
            position: 'after'
          }
        ],
        distinctGroup: true,
        pathGroupsExcludedImportTypes: ['{cozy-*,cozy-*/**}'],
        'newlines-between': 'always',
        warnOnUnassignedImports: true
      }
    ],
    'import/no-extraneous-dependencies': ['warn']
  }
}
