const readline = require('readline')

const askConfirmation = function(question, callback, elseCallback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(question, function(answer) {
    rl.close()
    if (answer === 'yes') {
      callback()
    } else {
      elseCallback()
    }
  })
}

module.exports = askConfirmation
