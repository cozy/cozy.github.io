const fs = require('fs')
const path = require('path')

/** Requires builtin script or from relative path */
const requireScript = scriptName => {
  const results = [
    path.resolve(scriptName),
    path.join(__dirname, '../scripts', scriptName)
  ].map(path => {
    try {
      return { ok: true, path, script: require(path) }
    } catch (e) {
      return { err: true, errorMessage: e.message, path: path }
    }
  })
  const ok = results.filter(result => result.ok)
  if (ok.length === 0) {
    console.error(`Tried ${results.map(x => x.path).join(',')}`)
    const errors = results
      .filter(result => result.err)
      .filter(
        result => result.errorMessage !== `Cannot find module '${result.path}'`
      )
      .map(result => `${result.path}: ${result.errorMessage}`)
    if (errors.length > 0) {
      throw new Error(errors[0])
    } else {
      throw new Error(`No script found for name ${scriptName}`)
    }
  } else if (ok.length === 1) {
    return ok[0].script
  } else {
    console.error(`Conflicting paths: ${ok.map(x => x.path).join(',')}`)
    throw new Error(`Conflicting scripts found for ${scriptName}`)
  }
}

/** List all builtin scripts */
const list = () => {
  const dir = path.join(__dirname, 'scripts')
  return fs
    .readdirSync(dir)
    .filter(x => /\.js$/.exec(x))
    .filter(x => !/\.spec\.js$/.exec(x))
    .map(x => x.replace(/\.js$/, ''))
}

module.exports = {
  require: requireScript,
  list
}
