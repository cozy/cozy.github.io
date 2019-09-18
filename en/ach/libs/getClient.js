const cozy = require('cozy-client-js')
const appPackage = require('../package.json')
const fs = require('fs')
const { addUtilityMethods } = require('./cozy-client-mixin')
const path = require('path')
const AppToken = cozy.auth.AppToken
const log = require('./log')
const { ChainedError } = require('./errors')
const jwt = require('jsonwebtoken')
const CLIENT_NAME = appPackage.name.toUpperCase()
const SOFTWARE_ID = CLIENT_NAME + '-' + appPackage.version

const enableDestroy = require('server-destroy')

const exported = {}

const revokeACHClients = (cozyClient, options) => {
  const { exclude } = options
  return cozyClient.settings.getClients().then(oAuthClients => {
    const revocations = oAuthClients
      .filter(
        oAuthClient =>
          oAuthClient.attributes.client_name === 'ACH' &&
          oAuthClient._id !== exclude
      )
      .map(achClient => {
        log.debug(`Revoking ACH client ${achClient._id}`)
        return cozyClient.settings.deleteClientById(achClient._id)
      })
    return Promise.all(revocations)
  })
}

exported.getClientWithoutToken = tokenPath => (url, docTypes = []) => {
  let permissions = docTypes.map(docType => docType.toString() + ':ALL')

  // Needed for ACH revocation after execution
  permissions.push('io.cozy.oauth.clients:ALL')

  let cozyClient = new cozy.Client({
    cozyURL: url,
    oauth: {
      storage: new cozy.MemoryStorage(),
      clientParams: {
        redirectURI: 'http://localhost:3333/do_access',
        softwareID: SOFTWARE_ID,
        clientName: CLIENT_NAME,
        scopes: permissions
      },
      onRegistered: onRegistered
    }
  })

  return cozyClient.authorize().then(creds => {
    let token = creds.token.accessToken
    cozyClient._token = new AppToken({ token })

    log.debug('Writing token file to ' + tokenPath)
    fs.writeFileSync(tokenPath, JSON.stringify({ token: token }), 'utf8')

    return revokeACHClients(cozyClient, {
      exclude: creds.client.clientID
    })
      .catch(error => {
        log.error('Cannot revoke ACH clients', error)
      })
      .then(() => cozyClient)
  })
}

// handle the redirect url in the oauth flow
const onRegistered = (client, url) => {
  const http = require('http')
  const opn = require('opn')

  let server

  return new Promise(resolve => {
    server = http.createServer((request, response) => {
      if (request.url.indexOf('/do_access') === 0) {
        resolve(request.url)
        response.end()
      }
    })

    server.listen(3333, () => {
      opn(url, { wait: false })
    })
    enableDestroy(server)
  }).then(
    url => {
      server.destroy()
      return url
    },
    err => {
      server.destroy()
      throw err
    }
  )
}

// returns a client when there is already a stored token
exported.getClientWithToken = tokenPath => url => {
  return new Promise((resolve, reject) => {
    try {
      // try to load a locally stored token and use that
      log.debug('Using token file ' + tokenPath)
      let stored = require(tokenPath)
      let cozyClient = new cozy.Client()

      cozyClient.init({
        cozyURL: url,
        token: stored.token
      })

      resolve(cozyClient)
    } catch (err) {
      reject(err)
    }
  })
}

exported.getClientWithTokenString = tokenString => async url => {
  const client = new cozy.Client()
  client.init({ cozyURL: url, token: tokenString })
  return client
}

// convenience wrapper around the 2 client getters
module.exports = (tokenPath, cozyUrl, docTypes) => {
  const absoluteTokenPath = tokenPath.startsWith('/')
    ? tokenPath
    : path.join(process.cwd(), tokenPath)

  let getClientFn
  if (fs.existsSync(absoluteTokenPath)) {
    getClientFn = exported.getClientWithToken(absoluteTokenPath)
  } else {
    const decoded = jwt.decode(tokenPath, { complete: true })
    if (decoded) {
      getClientFn = exported.getClientWithTokenString(tokenPath)
    } else {
      getClientFn = exported.getClientWithoutToken(absoluteTokenPath)
    }
  }

  return getClientFn(cozyUrl, docTypes)
    .then(client => {
      addUtilityMethods(client)
      return client
    })
    .catch(err => {
      if (
        err.message ===
        "ENOENT: no such file or directory, open '" + tokenPath + "'"
      ) {
        console.warn(
          'No stored token found, are you sure you generated one? Use option "-t" if you want to generate one next time.'
        )
      } else {
        throw new ChainedError('Could not create client', err)
      }

      return err
    })
}

Object.assign(module.exports, { exported })
