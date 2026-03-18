import Polyglot from 'node-polyglot'

import { toText } from './text'
import { isString, isObject, isArray, validateAgainst } from './validators'

const optionsTypes = {
  data: isObject,
  client: isObject,
  locales: isObject
}

const classAttrTypes = {
  template: isString,
  preferredChannels: isArray,
  category: isString
}

class NotificationView {
  constructor(options) {
    validateAgainst(options, optionsTypes)
    validateAgainst(this.constructor, classAttrTypes)

    const polyglot = new Polyglot()
    polyglot.extend(options.locales[options.lang])
    this.client = options.client
    this.t = (key, options) => polyglot.t(key, options)
    this.data = options.data
    this.lang = options.lang
  }

  async buildData() {
    return this.data
  }
}

NotificationView.toText = toText

export default NotificationView
