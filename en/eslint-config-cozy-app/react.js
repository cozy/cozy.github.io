import { fixupPluginRules } from '@eslint/compat'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

import basics from './basics.js'

export default [
  { files: ['**/*.jsx', '**/*.tsx'] },
  ...basics,
  {
    plugins: { react: fixupPluginRules(pluginReact) },
    rules: pluginReact.configs.recommended.rules,
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  },
  pluginReactHooks.configs.flat['recommended-latest'],
  {
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' }
      ]
    }
  },
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strict
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: process.cwd()
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }
      ],
      '@typescript-eslint/no-invalid-void-type': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-useless-constructor': 1,
      '@typescript-eslint/no-dynamic-delete': 1
    }
  }),
  {
    files: ['**/*.spec.jsx', '**/*.spec.js', '**/*.spec.tsx', '**/*.spec.ts'],
    rules: {
      'react/display-name': 'off'
    }
  }
]
