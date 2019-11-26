const LAST_INTERACTION_KEY = 'cozy.pin-last-interaction'
const PIN_SETTING_KEY = 'cozy.pin-doc'

const storage = (key, toString, fromString) => ({
  load: () => {
    const saved = localStorage.getItem(key)
    if (!saved) {
      return saved
    } else {
      try {
        return fromString(saved)
      } catch (e) {
        return null
      }
    }
  },

  save: val => {
    if (val === undefined) {
      return
    }
    localStorage.setItem(key, toString(val))
  },

  remove: () => {
    localStorage.removeItem(key)
  }
})

export const lastInteractionStorage = storage(
  LAST_INTERACTION_KEY,
  x => {
    const n = parseInt(x)
    return isNaN(n) ? null : n
  },
  n => n.toString()
)

export const pinSettingStorage = storage(
  PIN_SETTING_KEY,
  JSON.stringify,
  JSON.parse
)

export const clear = () => {
  pinSettingStorage.remove()
  lastInteractionStorage.remove()
}
