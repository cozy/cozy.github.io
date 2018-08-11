const travisScript = require('./lib/travis')
const manualScript = require('./lib/manual')

module.exports = {
  travis: travisScript,
  manual: manualScript
}
