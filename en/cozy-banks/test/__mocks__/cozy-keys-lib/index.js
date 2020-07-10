const keysLib = jest.requireActual('cozy-keys-lib')

module.exports = {
  withVaultClient: x => x,
  ...keysLib
}
