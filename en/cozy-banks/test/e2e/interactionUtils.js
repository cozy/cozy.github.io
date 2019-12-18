import { createInterface } from 'readline'

export const question = question =>
  new Promise(resolve => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    })
    readline.question(question, name => {
      readline.close()
      resolve(name)
    })
  })
