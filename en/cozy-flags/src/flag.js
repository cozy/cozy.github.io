import { Q } from 'cozy-client/dist/queries/dsl'

import FlagStore from './store'

const store = new FlagStore()

/**
 * Public API to use flags
 */
const flag = function () {
  const args = [].slice.call(arguments)
  if (args.length === 1) {
    return store.get(args[0])
  } else {
    store.set(args[0], args[1])
    return args[1]
  }
}

/** List all flags from the store */
export const listFlags = () => {
  return store.keys().sort()
}

/** Resets all the flags */
export const resetFlags = () => {
  listFlags().forEach(name => store.remove(name))
}

/**
 * Enables several flags
 *
 * Supports passing either  object flagName -> flagValue
 *
 * @param {string[]|Object} flagsToEnable
 */
export const enable = flagsToEnable => {
  let flagNameToValue
  if (Array.isArray(flagsToEnable)) {
    if (flagsToEnable.length === 0) {
      return
    }
    // eslint-disable-next-line no-console
    console.log(
      'flags.enable: Deprecation warning: prefer to use an object { flag1: true, flag2: true } instead of an array when using flags.enable'
    )
    flagNameToValue = flagsToEnable.map(flagName => [flagName, true])
  } else if (typeof flagsToEnable === 'object') {
    flagNameToValue = Object.entries(flagsToEnable)
  }

  if (!flagNameToValue) {
    return
  }

  for (const [flagName, flagValue] of flagNameToValue) {
    flag(flagName, flagValue)
  }
}

/**
 * Initializes flags from the remote endpoint serving instance flags
 *
 * @private
 * @see  https://docs.cozy.io/en/cozy-stack/settings/#get-settingsflags
 * @param  {import('cozy-client/types/CozyClient').default} client
 */
export const initializeFromRemote = async client => {
  const {
    data: { attributes }
  } = await client.query(
    Q('io.cozy.settings').getById('io.cozy.settings.flags')
  )

  enable(attributes)
}

const capitalize = str => str[0].toUpperCase() + str.slice(1)

export const getTemplateData = attr => {
  if (typeof document === 'undefined') {
    return null
  }
  const allDataNode = document.querySelector('[data-cozy]')
  const attrNode = document.querySelector(`[data-cozy-${attr}]`)
  try {
    if (allDataNode) {
      return JSON.parse(allDataNode.dataset.cozy)[attr]
    } else if (attrNode) {
      // eslint-disable-next-line no-console
      console.warn(
        'Prefer to use [data-cozy] to store template data. <div data-cozy="{{.CozyData}}></div>. "'
      )
      return JSON.parse(attrNode.dataset[`cozy${capitalize(attr)}`])
    } else {
      return null
    }
  } catch (e) {
    return null
  }
}

/**
 * Initialize from the template data injected by cozy-stack into the DOM
 *
 * @private
 * @see https://docs.cozy.io/en/cozy-stack/client-app-dev/#good-practices-for-your-application
 *
 * @returns {Boolean} - False is DOM initialization could not be completed, true otherwise
 */
export const initializeFromDOM = async () => {
  const domData = getTemplateData('flags')
  if (!domData) {
    return false
  }
  enable(domData)
  return true
}

/**
 * Initialize flags from DOM if possible, otherwise from remote endpoint
 *
 * @example
 *
 * Flags can be taken from the flags injected by the stack
 * ```
 * <div data-cozy="{{ .CozyData }}"></div>
 *
 * // not recommended but possible
 * <div data-flags="{{ .Flags }}"></div>
 * ````
 *
 * @param  {import('cozy-client/types/CozyClient').default} client - A CozyClient
 * @return {Promise} Resolves when flags have been initialized
 */
export const initialize = async client => {
  const domRes = await initializeFromDOM()
  if (domRes == false) {
    await initializeFromRemote(client)
  }
}

class FlagClientPlugin {
  constructor(client) {
    this.client = client
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.client.on('login', this.handleLogin)
    this.client.on('logout', this.handleLogout)

    this.setupInitializing()

    if (client.isLogged) this.handleLogin()
  }

  /**
   * Fetches and sets flags from remote
   */
  async refresh() {
    await flag.initializeFromRemote(this.client)
  }

  /**
   * Sets up a promise that can be awaited to wait for flag complete
   * initialization
   */
  setupInitializing() {
    this.initializing = new Promise(resolve => {
      this.resolveInitializing = resolve
    })
  }

  async handleLogin() {
    await flag.initialize(this.client)
    this.resolveInitializing()
    this.client.emit('plugin:flag:login')
  }

  async handleLogout() {
    flag.reset()
    this.setupInitializing()
    this.client.emit('plugin:flag:logout')
  }
}

FlagClientPlugin.pluginName = 'flags'

flag.store = store
flag.list = listFlags
flag.reset = resetFlags
flag.enable = enable
flag.initializeFromRemote = initializeFromRemote
flag.initializeFromDOM = initializeFromDOM
flag.initialize = initialize
flag.plugin = FlagClientPlugin

export default flag
