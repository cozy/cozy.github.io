const prompt = require('prompt')
const colorize = require('./utils/colorize')

const promptConfirm = question =>
  new Promise((resolve, reject) => {
    prompt.start()
    prompt.message = colorize.bold('Confirmation:')
    prompt.delimiter = ' '
    const promptProperties = [
      {
        name: 'confirm',
        description: colorize.orange(question),
        pattern: /^y(es)?$|^n(o)?$/i,
        message: 'Yes (y) or No (n)',
        required: true
      }
    ]

    return prompt.get(promptProperties, function (err, received) {
      console.log()
      if (err) {
        reject(new Error(colorize.red(`prompt: ${err}`)))
      } else if (received.confirm.match(/^y(es)?$/i)) {
        resolve(true)
      } else {
        resolve(false)
      }
    }).output
  })

module.exports = promptConfirm
