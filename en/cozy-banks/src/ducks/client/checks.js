import matches from 'lodash/matches'
import { triggerStates } from 'cozy-client/dist/models/trigger'
import { konnectorTriggersConn } from 'doctypes'
import sleep from 'utils/sleep'

const policies = {
  'never-executed': triggerState =>
    !triggerStates.getLastExecution(triggerState)
}

/**
 * Used to launch a service if it has never been launched.
 *
 * TODO Move StartupChecksPlugin to cozy-client
 *
 * @example
 * ```
 * client.registerPlugin(StartupChecksPlugin, {
 *   launchTriggers: [
 *       { slug: 'banks', name: 'autogroups', policy: 'never-executed' }
 *   ]
 * })
 * ```
 */
class StartupChecksPlugin {
  constructor(client, options) {
    this.client = client
    this.options = options
    this.doChecks = this.doChecks.bind(this)
    if (client.isLogged) {
      this.doChecks()
    }
    client.on('login', () => this.doChecks())
  }

  async checkToLaunchJob(triggers, launchOptions) {
    const launchPolicy = policies[launchOptions.policy]
    if (!launchPolicy) {
      throw new Error(`${launchOptions.policy} is not a valid policy`)
    }

    const matchAttributes = {
      type: launchOptions.type,
      message: {
        slug: launchOptions.slug,
        name: launchOptions.name
      }
    }

    const trigger =
      triggers &&
      triggers.find(
        matches({
          attributes: matchAttributes
        })
      )
    if (!trigger) {
      // eslint-disable-next-line no-console
      console.warn(
        `Trigger with attributes ${JSON.stringify(
          matchAttributes
        )} has not been found`
      )
      return
    }
    const triggerAttr = trigger.attributes

    if (launchPolicy(triggerAttr)) {
      const triggerCol = this.client.collection('io.cozy.triggers')
      triggerCol.launch(triggerAttr)
    }
  }

  async checkToLaunchJobs() {
    const client = this.client
    let triggers
    const triggersFromState = client.getQueryFromState(konnectorTriggersConn.as)
    if (triggersFromState) {
      triggers = triggersFromState.data
    } else {
      triggers = (await client.query(konnectorTriggersConn.query(client))).data
    }
    for (const launchOpts of this.options.launchTriggers || []) {
      await this.checkToLaunchJob(triggers, launchOpts)
    }
  }

  async doChecks() {
    if (this.options.delay) {
      await sleep(this.options.delay)
    }
    await this.checkToLaunchJobs()
  }
}

StartupChecksPlugin.pluginName = 'startupChecks'

export default StartupChecksPlugin
