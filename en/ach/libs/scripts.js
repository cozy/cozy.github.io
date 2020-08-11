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

const walkDir = dir => {
  let files = []
  const dirContent = fs.readdirSync(dir)
  dirContent.forEach(fileOrDir => {
    const pathFileOrDir = path.join(dir, fileOrDir)
    const stat = fs.statSync(pathFileOrDir)
    if (stat && stat.isDirectory()) {
      // Recursively walk in subdir
      files = files.concat(walkDir(pathFileOrDir))
    } else {
      if (path.basename(dir) !== 'scripts') {
        // Add dir basename for files in subdir
        fileOrDir = path.join(path.basename(dir), fileOrDir)
      }
      files.push(fileOrDir)
    }
  })
  return files
}

/** List all builtin scripts */
const list = () => {
  const dir = path.join(__dirname, '../scripts')
  const files = walkDir(dir)
  return files
    .filter(f => /\.js$/.exec(f))
    .filter(f => !/\.spec\.js$/.exec(f))
    .map(f => f.replace(/\.js$/, ''))
}

module.exports = {
  require: requireScript,
  list
}
