const VersionPlugin = require('./VersionPlugin')

module.exports = {
  plugins: [
    new VersionPlugin({
      packages: ['cozy-bar', 'cozy-ui']
    })
  ]
}
