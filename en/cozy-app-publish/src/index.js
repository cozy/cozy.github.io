const travisScript = require('./travis')
const manualScript = require('./manual')

module.exports = {
  travis: travisScript,
  manual: manualScript
}
