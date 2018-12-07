export { default as FlagSwitcher } from './browser/FlagSwitcher'

const flag = global
  ? require('./node/flag').default
  : require('./browser/flag').default

export default flag
