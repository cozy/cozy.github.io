/* eslint-disable no-console */

import { spawnSync } from 'child_process'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import omit from 'lodash/omit'

import { createClientInteractive } from 'cozy-client/dist/cli'
import {
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE,
  GROUP_DOCTYPE,
  BILLS_DOCTYPE
} from '../../src/doctypes'
import { importData } from './dataUtils'
import Mailhog from 'mailhog'
import MockServer from './mock-server'
import scenarios from './scenarios'
import fs from 'fs'

const SOFTWARE_ID = 'banks.alerts-e2e'

jest.setTimeout(10 * 1000)

const revokeOtherOAuthClientsForSoftwareId = async (client, softwareID) => {
  const { data: clients } = await client.stackClient.fetchJSON(
    'GET',
    `/settings/clients`
  )
  const currentOAuthClientId = client.stackClient.oauthOptions.clientID
  const otherOAuthClients = clients.filter(
    oauthClient =>
      oauthClient.attributes.software_id === softwareID &&
      oauthClient.id !== currentOAuthClientId
  )
  for (let oauthClient of otherOAuthClients) {
    await client.stackClient.fetchJSON(
      'DELETE',
      `/settings/clients/${oauthClient.id}`
    )
  }
}

const decodeEmail = (mailhog, attrs) =>
  attrs
    ? {
        ...attrs,
        subject: attrs.subject.replace(/_/g, ' ')
      }
    : attrs

const runService = async options => {
  const env = {
    ...process.env,
    IS_TESTING: 'test'
  }
  const processOptions = pickBy(
    {
      stdio: options.showOutput ? 'inherit' : undefined,
      env
    },
    Boolean
  )
  const res = spawnSync(
    'node',
    ['build/onOperationOrBillCreate'],
    processOptions
  )

  if (res.status !== 0) {
    console.error(`Error: onOperationOrBillCreate exited with 1.`)
    if (!options.showOutput) {
      console.error(`Re-run with -v to see its output.`)
    }
    throw new Error('Error while running onOperationOrBillCreate')
  }
}

const checkEmailForScenario = async (mailhog, scenario) => {
  const latestMessages = (await mailhog.messages(0, 1)).items
  const email = decodeEmail(
    mailhog,
    latestMessages.length > 0 ? pick(latestMessages[0], ['subject']) : null
  )
  if (scenario.expected.email) {
    expect(email).toMatchObject(scenario.expected.email)
  } else {
    expect(email).toBeFalsy()
  }
}

const checkPushForScenario = async (pushServer, scenario) => {
  let lastReq
  try {
    await pushServer.waitForRequest({ timeout: 1000 })
    lastReq = pushServer.getLastRequest()
  } catch (e) {
    // eslint-disable-line empty-catch
  }
  if (scenario.expected.notification) {
    expect(lastReq.body).toMatchObject(scenario.expected.notification)
  } else {
    expect(lastReq).toBeFalsy()
  }
}

const runScenario = async (client, scenario, options) => {
  await importData(client, scenario.data)

  if (options.mailhog) {
    await options.mailhog.deleteAll()
  }
  if (options.pushServer) {
    options.pushServer.clearRequests()
  }

  await runService(options)

  if (options.mailhog) {
    const emailMatch = await checkEmailForScenario(options.mailhog, scenario)
    return emailMatch
  } else {
    const pushMatch = await checkPushForScenario(options.pushServer, scenario)
    return pushMatch
  }
}

const cleanupDatabase = async client => {
  for (let doctype of [
    SETTINGS_DOCTYPE,
    TRANSACTION_DOCTYPE,
    ACCOUNT_DOCTYPE,
    GROUP_DOCTYPE,
    BILLS_DOCTYPE
  ]) {
    const col = client.collection(doctype)
    const { data: docs } = await col.getAll()
    if (docs.length > 0) {
      // The omit for _type can be removed when the following PR is resolved
      // https://github.com/cozy/cozy-client/pull/597
      await col.destroyAll(docs.map(doc => omit(doc, '_type')))
    }
  }
}

const setupClient = async options => {
  try {
    fs.unlinkSync(
      '/tmp/cozy-client-oauth-cozy-tools:8080-banks.alerts-e2e.json'
    )
  } catch (e) {
    // eslint-disable-next-line empty-block
  }

  const client = await createClientInteractive({
    uri: options.url,
    scope: [
      'io.cozy.oauth.clients:ALL',
      SETTINGS_DOCTYPE,
      TRANSACTION_DOCTYPE,
      ACCOUNT_DOCTYPE,
      GROUP_DOCTYPE,
      BILLS_DOCTYPE
    ],
    oauth: {
      softwareID: SOFTWARE_ID
    }
  })

  await revokeOtherOAuthClientsForSoftwareId(client, SOFTWARE_ID)
  if (options.push) {
    const clientInfos = client.stackClient.oauthOptions
    await client.stackClient.updateInformation({
      ...clientInfos,
      notificationPlatform: 'android',
      notificationDeviceToken: 'fake-token'
    })
  }
  return client
}

describe('alert emails/notifications', () => {
  let client
  let pushServer
  let mailhog
  let options = {
    url: process.env.COZY_URL || 'http://cozy.tools:8080',
    verbose: false
  }

  beforeAll(async () => {
    pushServer = new MockServer()
    await pushServer.listen()
    mailhog = Mailhog({ host: 'localhost' })
  })

  afterAll(async () => {
    await pushServer.close()
  })

  beforeEach(async () => {
    await cleanupDatabase(client)
  })

  describe('push', () => {
    beforeAll(async () => {
      client = await setupClient({ url: options.url })
    })

    for (const scenario of Object.values(scenarios)) {
      test(scenario.description, async () => {
        await runScenario(client, scenario, {
          showOutput: options.verbose,
          mailhog
        })
      })
    }
  })

  describe('email', () => {
    beforeAll(async () => {
      client = await setupClient({ url: options.url, push: true })
    })

    for (const scenario of Object.values(scenarios)) {
      test(scenario.description, async () => {
        await runScenario(client, scenario, {
          showOutput: options.verbose,
          pushServer
        })
      })
    }
  })
})
