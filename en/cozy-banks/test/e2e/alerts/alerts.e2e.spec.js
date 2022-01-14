/* eslint-disable no-console */

import pick from 'lodash/pick'

import { createClientInteractive } from 'cozy-client/dist/cli'
import {
  ACCOUNT_DOCTYPE,
  TRANSACTION_DOCTYPE,
  SETTINGS_DOCTYPE,
  GROUP_DOCTYPE,
  BILLS_DOCTYPE
} from 'src/doctypes'
import Mailhog from 'mailhog'
import MockServer from '../mock-server'
import scenarios from './scenarios'
import {
  dropDoctype,
  importACHData,
  revokeOtherOAuthClientsForSoftwareId
} from 'ducks/client/utils'
import { runService, makeToken } from 'test/e2e/utils'
import assert from '../../../src/utils/assert'
import sleep from 'utils/sleep'

const SOFTWARE_ID = 'banks.alerts-e2e'

jest.setTimeout(10 * 1000)

const decodeEmail = (mailhog, attrs) =>
  attrs
    ? {
        ...attrs,
        subject: attrs.subject.replace(/_/g, ' ')
      }
    : attrs

const checkEmailForScenario = async (mailhog, scenario) => {
  const latestMessages = (await mailhog.messages(0, 1)).items
  const email = decodeEmail(
    mailhog,
    latestMessages.length > 0 ? pick(latestMessages[0], ['subject']) : null
  )
  if (scenario.expected.email) {
    expect(email).not.toBeFalsy()
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
    // eslint-disable-next-line
  }
  if (scenario.expected.notification) {
    expect(lastReq).not.toBeFalsy()
    expect(lastReq.body).toMatchObject(scenario.expected.notification)
  } else {
    expect(lastReq).toBeFalsy()
  }
}

const runScenario = async (client, scenario, options) => {
  assert(client, 'No client')
  await importACHData(client, scenario.data)

  if (options.mailhog) {
    await options.mailhog.deleteAll()
  }
  if (options.pushServer) {
    options.pushServer.clearRequests()
  }

  try {
    await runService('onOperationOrBillCreate', [], options)
    await sleep(1000)
  } catch (e) {
    console.error(e.message)
    if (!options.showOutput) {
      console.error(`Re-run with -v to see its output.`)
    }
    throw e
  }

  if (options.mailhog) {
    const emailMatch = await checkEmailForScenario(options.mailhog, scenario)
    return emailMatch
  } else {
    const pushMatch = await checkPushForScenario(options.pushServer, scenario)
    return pushMatch
  }
}

const activatePushNotifications = async client => {
  const clientInfos = client.stackClient.oauthOptions
  console.log(
    'Activating push notifications for OAuth client',
    clientInfos.clientName
  )
  await client.stackClient.updateInformation({
    ...clientInfos,
    notificationPlatform: 'android',
    notificationDeviceToken: 'fake-token'
  })
}

const cleanupDatabase = async client => {
  if (!client) {
    return
  }
  for (let doctype of [
    SETTINGS_DOCTYPE,
    TRANSACTION_DOCTYPE,
    ACCOUNT_DOCTYPE,
    GROUP_DOCTYPE,
    BILLS_DOCTYPE
  ]) {
    await dropDoctype(client, doctype)
  }
}

const setupClient = async options => {
  const client = await createClientInteractive({
    uri: options.url,
    scope: [
      'io.cozy.oauth.clients:ALL',
      options.push ? 'io.cozy.fakedoctype' : null,
      SETTINGS_DOCTYPE,
      TRANSACTION_DOCTYPE,
      ACCOUNT_DOCTYPE,
      GROUP_DOCTYPE,
      BILLS_DOCTYPE
    ].filter(Boolean),
    oauth: {
      softwareID: SOFTWARE_ID
    }
  })

  await revokeOtherOAuthClientsForSoftwareId(client, SOFTWARE_ID)
  if (options.push) {
    await activatePushNotifications(client)
  }
  return client
}

beforeAll(() => {
  makeToken()
})

describe('alert emails/notifications', () => {
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

  describe('push', () => {
    let client

    beforeAll(async () => {
      client = await setupClient({ url: options.url, push: true })
    })

    beforeEach(async () => {
      await cleanupDatabase(client)
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

  describe('email', () => {
    let client

    beforeAll(async () => {
      client = await setupClient({ url: options.url })
    })

    beforeEach(async () => {
      await cleanupDatabase(client)
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
})
