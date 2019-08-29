import { spawn } from 'child_process'

export const launchCmd = (cmd, params, options) => {
  return new Promise(async (resolve, reject) => {
    const result = { stdout: [], stderr: [] }
    const cmdOptions = { encoding: 'utf8', ...options }
    const process = await spawn(cmd, params, cmdOptions)
    process.stdout.on('data', data => result.stdout.push(data.toString()))
    process.stderr.on('data', data => result.stderr.push(data.toString()))
    process.on('close', code => {
      result.code = code
      if (code === 0) {
        resolve(result)
      } else {
        reject(result)
      }
    })
  })
}
