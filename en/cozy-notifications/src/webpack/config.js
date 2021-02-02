import webpack from 'webpack'
import path from 'path'

export default {
  resolve: {
    alias: {
      handlebars: 'handlebars/runtime.js'
    }
  },
  module: {
    // mjml-core/lib/helpers/mjmlconfig and encoding/lib/iconv-loader use
    // expressions inside require. We do not need the functionality provided
    // by the dynamic require
    exprContextRegExp: /$^/,
    exprContextCritical: false,

    rules: [
      // data-uri has a hashbang at the top of the file
      {
        test: /node_modules\/datauri\/index.js$/,
        loader: 'shebang-loader'
      }
    ]
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/uglify-js\/tools\/node.js$/,
      path.join(__dirname, './uglify-node.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/mimer\/lib\/data\/parser.js$/,
      path.join('./src/hacks/mimer-parser.js')
    )
  ]
}
