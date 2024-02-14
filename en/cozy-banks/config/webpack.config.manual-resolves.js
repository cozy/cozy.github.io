const path = require('path')
const removeFalsyProperties = require('lodash/pickBy')
const { target } = require('./webpack.vars')

const mapToNodeModules = packages => {
  const res = {}
  packages.forEach(pkgName => {
    res[pkgName] = path.resolve(__dirname, `../node_modules/${pkgName}`)
  })
  return res
}

module.exports = {
  resolve: {
    alias: removeFalsyProperties({
      // Chart.js has moment as dependency for backward compatibility but it can
      // survive without it. We do not use date related functionality in chart.js
      // so it is safe to remove moment.
      // https://github.com/chartjs/Chart.js/blob/master/docs/getting-started/integration.md#bundlers-webpack-rollup-etc
      moment:
        target !== 'services'
          ? path.resolve(__dirname, '../src/utils/empty')
          : null,

      // This way, we do not inadvertently use non transpiled files
      'cozy-ui/react': 'cozy-ui/transpiled/react',

      // Resolving manually package that have multiple versions. They emit warnings with
      // DuplicatePackageChecker plugin. We always use the node_modules version.
      // https://github.com/darrenscerri/duplicate-package-checker-webpack-plugin#resolving-duplicate-packages-in-your-bundle
      ...mapToNodeModules([
        '@babel/runtime',
        'core-js',
        'cozy-client',
        'cozy-device-helper',
        'cozy-doctypes',
        'cozy-flags',
        'cozy-interapp',
        'cozy-realtime',
        'cozy-stack-client',
        'cozy-ui',
        'domutils',
        'extsprintf',
        'has',
        'hoist-non-react-statics',
        'inherits',
        'lodash',
        'node-forge',
        'node-polyglot',
        'pouchdb-binary-utils',
        'pouchdb-collections',
        'pouchdb-errors',
        'pouchdb-md5',
        'pouchdb-utils',
        'prop-types',
        'qs',
        'react',
        'react-is',
        'react-markdown',
        'react-redux',
        'redux',
        'regenerator-runtime',
        'safe-buffer',
        'string_decoder',
        'tough-cookie',
        'unist-util-is',
        'unist-util-visit',
        'unist-util-visit-parents',
        'uuid',
        'warning'
      ]),

      // We do not need mime-db (used in cozy-stack-client::FileCollection) so we fake it
      'mime-db': path.resolve(__dirname, '../src/utils/empty-mime-db')
    })
  }
}
