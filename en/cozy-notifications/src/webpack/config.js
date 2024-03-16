import path from 'path'

import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'

export default {
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js'
    }
  },
  optimization: {
    minimizer: [
      // Minimizing everything breaks mjml.
      // Fix `Element mj-head doesn't exist or is not registered ...` error
      // when sending a notification at runtime after a build.
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: {
            keep_fnames: true
          }
        }
      })
    ]
  },
  module: {
    // mjml-core/lib/helpers/mjmlconfig and encoding/lib/iconv-loader use
    // expressions inside require. We do not need the functionality provided
    // by the dynamic require
    exprContextRegExp: /$^/,
    exprContextCritical: false,
    rules: [
      {
        test: /\.hbs$/,
        loader: 'raw-loader'
      }
    ]
  },
  plugins: [
    // Fix "Error: Cannot find module '../lib/utils.js'" at runtime
    // https://github.com/mjmlio/mjml/issues/2132
    new webpack.NormalModuleReplacementPlugin(
      /node_modules\/uglify-js\/tools\/node.js$/,
      path.join(__dirname, './uglify-node.js')
    )
  ]
}
