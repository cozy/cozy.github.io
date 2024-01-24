// Use JEST_PROJECT to switch between normal tests and end-to-end
// tests.
// See https://github.com/facebook/jest/issues/7542 for more information
// and to see if this features has been integrated into Jest directly.
const JEST_PROJECT = process.env.JEST_PROJECT

module.exports = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'styl'],
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>'],
  moduleNameMapper: {
    '\\.(png|gif|jpe?g|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '\\.styl$': 'identity-obj-proxy',
    '\\.webapp$': 'identity-obj-proxy',
    '!!raw-loader!(.*)': '$1',
    '\\.css$': 'identity-obj-proxy',
    '^cozy-client$': 'cozy-client/dist/index'
  },
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testPathIgnorePatterns: [
    'node_modules',
    JEST_PROJECT === 'e2e' ? null : '.*\\.e2e\\.spec\\.js'
  ].filter(Boolean),
  testMatch: [
    JEST_PROJECT === 'e2e' ? null : '**/?(*.)(spec).js?(x)',
    JEST_PROJECT === 'e2e' ? '**/?(*.)(e2e.spec).js?(x)' : null
  ].filter(Boolean),
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '\\.css$': '<rootDir>/test/readFileESM.js',
    '\\.styl$': '<rootDir>/test/readFileESM.js',
    '\\.hbs$': '<rootDir>/test/readFileESM.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(cozy-keys-lib|cozy-harvest-lib|cozy-sharing|cozy-ui|cozy-client|cozy-notifications|copy-text-to-clipboard))'
  ],
  globals: {
    __ALLOW_HTTP__: false,
    __TARGET__: 'browser',
    __DEV__: false,
    __POUCH__: false,
    __SENTRY_TOKEN__: 'token',
    cozy: {}
  },
  setupFiles: ['jest-localstorage-mock', './test/jest.setup.js']
}
