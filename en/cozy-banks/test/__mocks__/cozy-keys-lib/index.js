const keysLib = jest.requireActual('cozy-keys-lib')

module.exports = {
  ...keysLib,
  withVaultClient: x => x,
  withVaultUnlockContext: x => x
}
