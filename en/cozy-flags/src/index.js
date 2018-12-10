export { default as FlagSwitcher } from './browser/FlagSwitcher'

const isNode = global && global.process && global.process.title === 'node'

const flag = isNode
  ? require('./node/flag').default
  : require('./browser/flag').default

export default flag
