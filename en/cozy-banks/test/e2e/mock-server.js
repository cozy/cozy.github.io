/* eslint-disable no-console */

/**
 * This is a server that can receive push notifications from the
 * stack. It is used in E2E tests to check that we correctly receive
 * notifications from a service.
 *
 * When launched with `node mock-server.js`, the server is launched
 * and will print the notifications received.
 */

const express = require('express')

const DEFAULT_PORT = 3001

class MockServer {
  constructor(options = {}) {
    this.options = options
    this.requests = []
    this.waiters = []

    const app = express()
    app.use(express.json())

    app.all(/.*/, (req, res) => {
      this.requests.push(req)
      if (this.options.onRequest) {
        this.options.onRequest(req)
      }
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
      const port = this.options.port || DEFAULT_PORT
      console.log(`Push notifications mock server listening on ${port}...`)
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

if (require.main === module) {
  const server = new MockServer({
    port: process.env.PORT,
    onRequest: req => {
      console.log('Received push notification', req.body)
    }
  })
  server.listen()
}
