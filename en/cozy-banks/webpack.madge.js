const path = require('path')

module.exports = {
  resolve: {
    extensions: ['.jsx', '.js', '.json'],
    alias: {
      utils: path.resolve(__dirname, 'src/utils/'),
      ducks: path.resolve(__dirname, 'src/ducks/'),
      components: path.resolve(__dirname, 'src/components/')
    }
  }
}
