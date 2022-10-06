const helpers = jest.genMockFromModule('../helpers')
const helpersActual = jest.requireActual('../helpers')

helpers.getArchiveFileName = helpersActual.getArchiveFileName

module.exports = helpers
