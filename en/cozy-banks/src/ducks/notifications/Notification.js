import log from 'cozy-logger'
import './url-polyfill'
import { generateUniversalLink } from 'cozy-ui/transpiled/react/AppLinker'
import Handlebars from 'handlebars'
import { extractInfo, replaceParts } from './html/templates/utils'
import mapValues from 'lodash/mapValues'
import layouts from 'handlebars-layouts'
import { helpers, partials } from './html/templates'
import { renderMJML } from './html/utils'

const isString = x => typeof x === 'string'
const isArray = x => typeof x == 'object' && typeof x.length !== undefined

const types = {
  template: isString,
  preferredChannels: isArray,
  category: isString
}

const validateAgainst = (obj, types) => {
  for (let [name, validator] of Object.entries(types)) {
    if (!validator(obj[name])) {
      throw new Error(
        `ValidationError: ${name} attribute (value: ${
          obj[name]
        }) does not validate against ${validator.name}.`
      )
    }
  }
}

class Notification {
  constructor(config) {
    this.t = config.t
    this.data = config.data
    this.cozyClient = config.cozyClient

    const cozyUrl = this.cozyClient._url

    this.urls = this.constructor.generateURLs(cozyUrl)

    validateAgainst(this.constructor, types)
  }

  static generateURLs(cozyUrl) {
    const commonOpts = { cozyUrl, slug: 'banks' }
    return {
      banksUrl: generateUniversalLink({ ...commonOpts }),
      balancesUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/balances'
      }),
      transactionsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/transactions'
      }),
      settingsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/settings/configuration'
      }),
      healthReimbursementsUrl: generateUniversalLink({
        ...commonOpts,
        nativePath: '/balances/reimbursements'
      })
    }
  }

  /**
   * Implement this method to add additional attributes to the notification
   */
  getNotificationAttributes() {
    return {}
  }

  /**
   * A notification can add helpers and partials in this function
   */
  prepareHandlebars(Handlebars) {
    Handlebars.registerHelper({ t: this.t })
    Handlebars.registerHelper(helpers)
    Handlebars.registerPartial(partials)

    const tGlobal = (key, data) => this.t('Notifications.email.' + key, data)
    Handlebars.registerHelper({ tGlobal })

    layouts.register(Handlebars)
  }

  /**
   * A notification can choose not to be sent based on templateData
   */
  shouldSendNotification() {
    return true
  }

  /**
   * Orchestrates the building of the notification
   *
   * Does the two-phase templating that is in preparation for when the stack
   * does the global template.
   *
   * The goals is to separate the rendering of each part of the emails from
   * the wrapping inside a known template, and the MJML rendering.
   */
  async buildNotification() {
    const { parts, ast } = extractInfo(this.constructor.template)
    const compiledParts = mapValues(parts, Handlebars.compile)

    this.prepareHandlebars(Handlebars)

    const templateData = await this.buildTemplateData()

    if (!templateData || !this.shouldSendNotification(templateData)) {
      return
    }

    const renderedParts = mapValues(compiledParts, block => block(templateData))
    // Should be done on the stack at some point, we will pass directly the
    // compiled parts and the name of the extending template
    replaceParts(parts, renderedParts)
    const template = Handlebars.compile(ast)

    // TODO Do not pass templateData to global template function
    // templateData is passed to the global template function for now but it should change
    // at some point since it is the stack that will do this part and it will
    // not receive the application specific templateData
    // To prevent this it would be good to also extract the *parts* inside bank-layout and
    // compile them with the templateData.
    const contentHTML = renderMJML(template(templateData))

    return {
      category: this.constructor.category,
      title: this.getTitle(templateData),
      message: this.getPushContent(templateData),
      preferred_channels: this.constructor.preferredChannels,
      content: this.constructor.toText(contentHTML),
      content_html: contentHTML,
      ...this.getNotificationAttributes()
    }
  }

  async sendNotification() {
    if (!this.data) {
      log('info', `Notification hasn't data`)
      return
    }

    try {
      const attributes = await Promise.resolve(
        this.buildNotification(this.data)
      )

      if (!attributes) {
        log('info', `Notification hasn't attributes`)
        return
      }

      log('info', `Send notifications with category: ${attributes.category}`)
      const cozyClient = this.cozyClient
      await cozyClient.fetchJSON('POST', '/notifications', {
        data: {
          type: 'io.cozy.notifications',
          attributes
        }
      })

      if (this.onSendNotificationSuccess) {
        this.onSendNotificationSuccess()
      }
    } catch (err) {
      log('info', `Notification error`)
      log('info', err)
      // eslint-disable-next-line no-console
      console.log(err)
    }
  }
}

Notification.template = '' // Children classes will override this
Notification.preferredChannels = ['email', 'mobile'] // Children classes will override this
Notification.category = 'notification' // Children classes will override this
export default Notification
