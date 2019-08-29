module.exports = function(api) {
  api.cache(true)

  return {
    sourceType: 'unambiguous',
    presets: ['cozy-app'],
    plugins: ['babel-plugin-lodash', 'babel-plugin-date-fns']
  }
}
