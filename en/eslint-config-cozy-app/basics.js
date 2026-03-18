import { fixupPluginRules } from '@eslint/compat'
import js from '@eslint/js'
import pluginImport from 'eslint-plugin-import'
import pluginJest from 'eslint-plugin-jest'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginPromise from 'eslint-plugin-promise'
import globals from 'globals'

export default [
  js.configs.recommended,
  pluginPromise.configs['flat/recommended'],
  prettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      jest: pluginJest,
      import: fixupPluginRules(pluginImport)
    },
    rules: {
      'no-console': 'error',
      'no-param-reassign': 'warn',
      'no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }
      ],
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
              pattern: '{cozy-*,cozy-*/**,twake-*,twake-*/**}',
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
          pathGroupsExcludedImportTypes: [
            '{cozy-*,cozy-*/**,twake-*,twake-*/**}'
          ],
          'newlines-between': 'always',
          warnOnUnassignedImports: true
        }
      ],
      'import/no-extraneous-dependencies': ['warn']
    }
  }
]
