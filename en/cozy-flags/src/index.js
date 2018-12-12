import isNode from 'detect-node'
export { default as FlagSwitcher } from './browser/FlagSwitcher'

const flag = isNode
  ? require('./node/flag').default
  : require('./browser/flag').default

export default flag
