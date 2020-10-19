import importedMinilog from '@cozy/minilog'

const inBrowser = typeof window !== 'undefined'
const minilog = (inBrowser && window.minilog) || importedMinilog

const logger = minilog('cozy-realtime')
logger.minilog = importedMinilog

minilog.enable()
minilog.suggest.deny('cozy-realtime', 'warn')
minilog.suggest.allow('cozy-realtime', 'warn')

export default logger
