const request = require('request-promise-native')
const fs = require('fs')
const CozyClient = require('cozy-client')
const keyBy = require('lodash/keyBy')
const fromPairs = require('lodash/fromPairs')

const cloudery = require('./cloudery')
const { assert, waitUntil, extractForm } = require('./utils')
const names = require('./names.json')
const adjectives = require('./adjectives.json')

const second = 1000

/**
 * Use the registration token present after creation to change the passphrase
 * Changing the passphrase will set a sessionId in the cookie jar
 * With this session, we will be able to access applications in our Cozy
 */
const setPassphrase = async (instanceInfo, passphrase, cookieJar) => {
  assert(cookieJar, 'Must pass cookie jar to setPassphrase')
  const { fqdn, token } = instanceInfo
  await request.post({
    url: 'https://' + fqdn + '/settings/passphrase',
    form: {
      register_token: token,
      iterations: 100000,
      passphrase
    },
    jar: cookieJar
  })
}

/**
 * Creates an instance using Cloudery
 * Waits for cozy creation to be finished before resolving
 * A cozysessionid will be present in the cookie jar after the creation
 */
const createInstance = async (creationOptions, cookieJar) => {
  assert(cookieJar, 'Must pass cookie jar when creating instance')
  const resp = await cloudery.createInstance({
    account: creationOptions.account,
    domain: 'cozy.wtf',
    email: creationOptions.email,
    use_tracker: 'false',
    slug: creationOptions.slug,
    offer: 'cozy_beta'
  })

  const readyCozy = await waitUntil({
    exec: async () => {
      const info = await cloudery.fetchInstanceInfo(resp._id)
      return info
    },
    check: info => {
      return info.state === 'created'
    },
    waitMessage: (attempt, lastRes) => {
      return `Instance not ready yet, last state ${lastRes.state}`
    },
    timeout: 60 * second
  })

  // Setting a passphrase will set a cozysessionid in the cookie jar
  const passphrase = creationOptions.passphrase
  await setPassphrase(readyCozy, passphrase, cookieJar)

  return readyCozy
}

/**
 * Deletes and instance via its id
 */
const deleteInstance = id => {
  return cloudery.deleteInstance(id)
}

const submitOAuthAuthorizationForm = async ({
  cozyURL,
  authenticationURL,
  cookieJar
}) => {
  const res = await request.get({
    url: authenticationURL,
    jar: cookieJar
  })
  const form = extractForm(res)
  console.info('Extracted form from authorization page', form)
  const inputsByName = keyBy(form.inputs, x => x.name)
  const csrfValue = inputsByName.csrf_token.value
  assert(csrfValue, 'Could not find csrf token in authorization form')
  const csrfCookie = request.cookie(`_csrf=${csrfValue}`)
  console.info('Setting cookie ', csrfCookie, 'for uri', cozyURL)
  cookieJar.setCookie(csrfCookie, cozyURL)
  const formValues = fromPairs(form.inputs.map(x => [x.name, x.value]))
  console.info('Will send form values', formValues)
  request.post({
    url: cozyURL + form.action,
    form: formValues,
    jar: cookieJar,
    followAllRedirects: true
  })
}

/**
 * Creates client by following the OAuth flow
 * Relies on cookie jar to have a session id for the Cozy
 */
const createClientWithCurrentSession = async (clientOptions, cookieJar) => {
  assert(
    cookieJar,
    'Must pass clientOptions & cookieJar to createClientWithCurrentSession'
  )
  const client = await CozyClient.createClientInteractive(clientOptions, {
    shouldOpenAuthenticationPage: false,
    onListen: async ({ authenticationURL }) => {
      submitOAuthAuthorizationForm({
        cozyURL: clientOptions.uri,
        authenticationURL,
        cookieJar: cookieJar
      })
    }
  })
  return client
}

const generateSlug = () => {
  const i = Math.floor(Math.random() * names.length)
  const j = Math.floor(Math.random() * adjectives.length)
  return 'test' + adjectives[j] + names[i]
}

const FileCookieStore = require('tough-cookie-filestore')

const setupCookieJar = jarFile => {
  if (!fs.existsSync(jarFile)) {
    fs.writeFileSync(jarFile, '{}')
  }
  const jar = request.jar(new FileCookieStore(jarFile))
  return jar
}

const getCoziesWithSessionFromCookieJar = jar => {
  const domains = Object.keys(jar._jar.store.idx)
  return domains.filter(domain => {
    const rootCookies = jar._jar.store.idx[domain]['/']
    return rootCookies && rootCookies['cozysessid']
  })
}

const getCoziesWithSessionFromCookieFile = cookieJarFilename => {
  if (!fs.existsSync(cookieJarFilename)) {
    return []
  }

  const jar = request.jar(new FileCookieStore(cookieJarFilename))
  const domainsWithSession = getCoziesWithSessionFromCookieJar(jar)
  return domainsWithSession
}

const backupUUID = (instanceInfo, filename) => {
  let data
  if (!fs.existsSync(filename)) {
    data = {}
  } else {
    data = JSON.parse(fs.readFileSync(filename))
  }
  data[instanceInfo.slug] = instanceInfo._id
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
}

/**
 * Returns a client usable for E2E tests
 *
 * - Tries to reuse cozies by looking at sessions in the cookie jar
 * - Otherwise creates a Cozy
 * - Saves a backup of cozy domain to uuid for easy deletion
 */
const setupE2EInstance = async options => {
  const {
    cookieJarFilename,
    uuidBackupFilename,
    domain,
    email,
    account
  } = options
  let domains = getCoziesWithSessionFromCookieFile(cookieJarFilename)
  let cozyURI
  const cookieJar = setupCookieJar(cookieJarFilename)
  if (domains.length === 0) {
    const slug = generateSlug()
    console.log(`Creating ${slug}...`)
    const instanceInfo = await createInstance(
      {
        domain,
        slug,
        email,
        account,
        passphrase: 'Hello'
      },
      cookieJar
    )
    backupUUID(instanceInfo, uuidBackupFilename)
    cozyURI = `https://${slug}.${domain}`
    console.log(`Cozy created ✅`)
  } else {
    cozyURI = `https://${domains[0]}`
  }

  const client = await createClientWithCurrentSession(
    {
      scope: ['io.cozy.tests'],
      uri: cozyURI,
      oauth: {
        softwareID: 'io.cozy.ach.e2e'
      }
    },
    cookieJar
  )
  return { client }
}

module.exports = {
  createInstance,
  deleteInstance,
  createClientWithCurrentSession,
  generateSlug,
  setupCookieJar,
  getCoziesWithSessionFromCookieJar,
  setupE2EInstance
}
