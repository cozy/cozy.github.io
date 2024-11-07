'use strict'

const basics = require('./basics')

module.exports = {
  plugins: basics.plugins.concat(['react-hooks']),
  extends: basics.extends.concat(['plugin:react/recommended']),
  parser: basics.parser,
  parserOptions: { ecmaFeatures: { jsx: true } },
  env: basics.env,
  settings: { react: { version: 'detect' } },
  rules: Object.assign({}, basics.rules, {
    'react/prop-types': 'off',
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never' }
    ],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }),
  overrides: [
    {
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/strict'
      ],

      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'packages/**/tsconfig.json',
        tsconfigRootDir: './'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { ignoreRestSiblings: true }
        ],
        '@typescript-eslint/no-invalid-void-type': 0,
        '@typescript-eslint/no-non-null-assertion': 0,
        '@typescript-eslint/no-useless-constructor': 1,
        '@typescript-eslint/no-dynamic-delete': 1
      }
    },
    {
      files: ['**/*.spec.jsx', '**/*.spec.js', '**/*.spec.tsx', '**/*.spec.ts'],
      rules: {
        'react/display-name': ['off']
      }
    }
  ]
}
