const requireHook = (hook, type) => {
  try {
    return require(`${__dirname}/../lib/hooks/${type}/` + hook + '.js')
  } catch (error) {
    // Not builtin
    return require(process.cwd() + '/' + hook)
  }
}

module.exports = async (hookNames, type, options) => {
  let hookOptions = options

  if (hookNames) {
    const hooks = hookNames.split(',')

    for (const hook of hooks) {
      try {
        const hookScript = requireHook(hook, type)
        console.log(`↳ ℹ️  Running ${type}publish hook ${hook}`)
        hookOptions = (await hookScript(hookOptions)) || hookOptions
      } catch (error) {
        console.error(
          `↳ ❌  An error occured with ${type}publish hook ${hook}: ${
            error.message
          }`
        )
        throw new Error(`${type}publish hooks failed`)
      }
    }
  }

  return hookOptions
}
