import MicroEE from 'microee'

import lsAdapter from './ls-adapter'

/**
 * In memory key value storage.
 *
 * Can potentially be backed by localStorage if present

 * Emits `change` when a key is set (eventEmitter)
 */
class FlagStore {
  constructor() {
    this.store = {}
    if (typeof localStorage !== 'undefined') {
      this.longtermStore = lsAdapter
    }
    this.restore()
  }

  restore() {
    if (!this.longtermStore) {
      return
    }
    const allValues = this.longtermStore.getAll()
    for (const [flag, val] of Object.entries(allValues)) {
      this.store[flag] = val
      this.emit('change', flag)
    }
  }

  keys() {
    return Object.keys(this.store)
  }

  get(name) {
    // eslint-disable-next-line no-prototype-builtins
    if (this.store.hasOwnProperty(name)) {
      return this.store[name]
    }

    if (typeof name === 'string') {
      const nameElements = name.split('.')
      const size = nameElements.length
      for (let idx = size - 1; idx > 0; idx--) {
        const currentKey = nameElements.slice(0, idx).join('.')
        // eslint-disable-next-line no-prototype-builtins
        if (this.store.hasOwnProperty(currentKey)) {
          return nameElements
            .slice(idx, size)
            .reduce((previousValue, currentValue) => {
              // eslint-disable-next-line no-prototype-builtins
              return previousValue && previousValue.hasOwnProperty(currentValue)
                ? previousValue[currentValue]
                : null
            }, this.store[currentKey])
        }
      }
    }

    return null
  }

  set(name, value) {
    if (this.longtermStore) {
      this.longtermStore.setItem(name, value)
    }
    this.store[name] = value
    this.emit('change', name)
  }

  remove(name) {
    delete this.store[name]
    if (this.longtermStore) {
      this.longtermStore.removeItem(name)
    }
    this.emit('change', name)
  }
}

MicroEE.mixin(FlagStore)

export default FlagStore
