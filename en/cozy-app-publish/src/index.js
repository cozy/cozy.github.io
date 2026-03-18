const manualScript = require('./manual')
const travisScript = require('./travis')

module.exports = {
  travis: travisScript,
  manual: manualScript
}
