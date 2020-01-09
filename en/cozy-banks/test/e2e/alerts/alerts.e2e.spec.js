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
import { runService } from 'test/e2e/serviceUtils'

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
    expect(email).not.toBe(null)
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
    expect(lastReq).not.toBe(null)
    expect(lastReq.body).toMatchObject(scenario.expected.notification)
  } else {
    expect(lastReq).toBeFalsy()
  }
}

const runScenario = async (client, scenario, options) => {
  await importACHData(client, scenario.data)

  if (options.mailhog) {
    await options.mailhog.deleteAll()
  }
  if (options.pushServer) {
    options.pushServer.clearRequests()
  }

  try {
    await runService('onOperationOrBillCreate', options)
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

const cleanupDatabase = async client => {
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

const areEnvVariablesProvided = Boolean(
  process.env.COZY_URL && process.env.COZY_CREDENTIALS
)

const setupClient = async options => {
  if (!areEnvVariablesProvided) {
    return
  }

  const client = await createClientInteractive({
    uri: options.url,
    scope: [
      'io.cozy.oauth.clients:ALL',
      options.push ? 'io.cozy.fake-doctype' : null,
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
    const clientInfos = client.stackClient.oauthOptions
    await client.stackClient.updateInformation({
      ...clientInfos,
      notificationPlatform: 'android',
      notificationDeviceToken: 'fake-token'
    })
  }
  return client
}

test('COZY_URL and COZY_CREDENTIALS must be provided to E2E test', () => {
  expect(areEnvVariablesProvided).toBe(true)
})

const describer = areEnvVariablesProvided ? describe : xdescribe

describer('alert emails/notifications', () => {
  let client
  let pushServer
  let mailhog
  let options = {
    url: process.env.COZY_URL || 'http://cozy.tools:8080',
    verbose: false
  }

  beforeEach(() => {
    if (!process.env.COZY_URL || !process.env.COZY_CREDENTIALS) {
      throw new Error('Must provide COZY_URL and COZY_CREDENTIALS')
    }
  })

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
          pushServer
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
          mailhog
        })
      })
    }
  })
})
