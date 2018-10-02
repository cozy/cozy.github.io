'use strict'

const basics = require('./basics')

module.exports = {
  plugins: basics.plugins,
  extends: basics.extends.concat(['plugin:vue/recommended']),
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: basics.env,
  rules: basics.rules
}
