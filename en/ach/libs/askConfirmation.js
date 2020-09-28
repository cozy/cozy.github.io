const readline = require('readline')

const askConfirmation = function(question) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(question, function(answer) {
      rl.close()
      if (answer === 'yes') {
        resolve()
      } else {
        reject()
      }
    })
  })
}

module.exports = askConfirmation
