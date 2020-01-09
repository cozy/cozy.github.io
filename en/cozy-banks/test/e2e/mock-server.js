/* eslint-disable no-console */

const express = require('express')

class MockServer {
  constructor(options = {}) {
    this.options = options
    this.requests = []
    this.waiters = []

    const app = express()
    app.use(express.json())

    app.all(/.*/, (req, res) => {
      this.requests.push(req)
      this.flushWaiters()
      res.send('OK')
    })

    this.app = app
  }

  clearRequests() {
    this.requests = []
  }

  getLastRequest() {
    const req = this.requests[this.requests.length - 1]
    return req ? req : null
  }

  waitForRequest(options) {
    return new Promise((resolve, reject) => {
      let timeout
      const onRequest = () => {
        resolve()
        clearTimeout(timeout)
      }
      if (options.timeout) {
        timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for request'))
        }, options.timeout)
      }
      if (this.requests.length === 0) {
        this.waiters.push(onRequest)
      } else {
        onRequest()
      }
    })
  }

  flushWaiters() {
    for (let w of this.waiters) {
      w()
    }
    this.waiters = []
  }

  listen() {
    return new Promise(resolve => {
      const port = this.options.port || 3001
      const server = this.app.listen(port, () => {
        this.server = server
        resolve(server)
      })
    })
  }

  close() {
    return new Promise(resolve => {
      this.server.close(resolve)
    })
  }
}

module.exports = MockServer
