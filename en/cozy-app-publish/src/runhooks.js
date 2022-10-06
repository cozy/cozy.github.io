const logger = require('./utils/logger')

const requireHook = (hook, type) => {
  const builtInHookPath = `${__dirname}/hooks/${type}/` + hook + '.js'
  const customHookPath = process.cwd() + '/' + hook
  try {
    return require(builtInHookPath)
  } catch (err1) {
    try {
      // Not builtin
      return require(customHookPath)
    } catch (err2) {
      logger.error(`Error when loading ${builtInHookPath}`, err1)
      logger.error(`Error when loading ${customHookPath}`, err2)
      throw new Error(`"${hook}" could not be loaded.`)
    }
  }
}

module.exports = async (hookNames, type, options) => {
  let hookOptions = options

  if (hookNames) {
    const hooks = hookNames.split(',')

    for (const hook of hooks) {
      try {
        const hookScript = requireHook(hook, type)
        logger.log(`↳ ℹ️  Running ${type}publish hook ${hook}`)
        hookOptions = (await hookScript(hookOptions)) || hookOptions
      } catch (error) {
        logger.error(
          `↳ ❌  An error occured with ${type}publish hook ${hook}: ${error.message}`
        )
        throw new Error(`${type}publish hooks failed`)
      }
    }
  }

  return hookOptions
}
