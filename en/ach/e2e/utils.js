const { JSDOM } = require('jsdom')

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

/**
 * Waits until promise maker returns a promise resolving to something truthy
 */
const waitUntil = async (options = {}) => {
  const exec = options.exec
  const check = options.check
  const delay = options.delay || 1000
  const timeout = options.timeout || 5 * 1000
  const waitMessage = options.waitMessage
  const start = Date.now()
  let res = await exec()
  let checkValue = check(res)
  let i = 0
  while (!checkValue) {
    const now = Date.now()
    if (now - start > timeout) {
      throw new Error('Timeout for waitUntil')
    }
    if (waitMessage) {
      const msg = waitMessage(i, res)
      console.log(msg)
    }
    i++
    await sleep(delay)
    res = await exec()
    checkValue = check(res)
  }
  return res
}

const assert = (cond, msg) => {
  if (!cond) {
    throw new Error(msg)
  }
}

/**
 * Crude form parsing from HTML
 *
 * Takes HTML as input and return { inputs, action, method }
 * Inputs are returned as { name, value }
 *
 * Only HTML input are supported
 */
const extractForm = html => {
  const { window } = new JSDOM(html)
  const { document } = window
  const form = document.querySelector('form')
  const inputs = Array.from(form.querySelectorAll('input')).map(field => {
    const name = field.getAttribute('name')
    const value = field.getAttribute('value')
    return { name, value }
  })
  const action = form.getAttribute('action')
  const method = form.getAttribute('method')
  return { inputs, action, method }
}

module.exports = {
  extractForm,
  waitUntil,
  sleep,
  assert
}
