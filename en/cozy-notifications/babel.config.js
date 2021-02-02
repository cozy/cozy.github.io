module.exports = {
  presets: [['cozy-app', { transformRuntime: { helpers: true } }]],
  plugins: [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.hbs', '.css', '.styl']
      }
    ]
  ],
  env: {
    test: {
      presets: [['cozy-app', { transformRuntime: { helpers: true } }]]
    }
  }
}
