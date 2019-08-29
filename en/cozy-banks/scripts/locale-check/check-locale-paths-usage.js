const fs = require('fs')
const argparse = require('argparse')
const flatten = require('lodash/flatten')
const syspath = require('path')

/**
 * Returns all possible "prefixes" of path
 *
 * "a.b.c" => ["a", "a.b", "a.b.c"]
 */
const explodePath = path => {
  const toks = path.split('.')
  let cur
  const res = []
  for (let tok of toks) {
    cur = cur ? cur + '.' + tok : tok
    res.push(cur)
  }
  return res
}

const explodePaths = paths => paths.map(explodePath)

const detectUnused = (usedInCodePaths, usedInTranslationPaths) => {
  const usedInCodeSet = new Set(flatten(explodePaths(usedInCodePaths)))
  const withPrefixes = usedInTranslationPaths.map(x => ({
    original: x,
    prefixes: explodePath(x)
  }))

  for (const { original, prefixes } of withPrefixes) {
    let ok
    for (const prefix of prefixes) {
      if (usedInCodeSet.has(prefix)) {
        ok = true
      }
    }
    if (!ok) {
      // eslint-disable-next-line no-console
      console.log(`${original} does not seem to be used`)
    }
  }
}

const readPathFile = filepath => {
  return fs
    .readFileSync(filepath)
    .toString()
    .split('\n')
    .filter(Boolean)
}

const joinUnlessAbsolute = (path1, path2) => {
  return path2.startsWith('/') ? path2 : syspath.join(path1, path2)
}

const main = () => {
  const parser = new argparse.ArgumentParser()
  parser.addArgument('used-in-code')
  parser.addArgument('used-in-translation')
  const args = parser.parseArgs()
  const cwd = process.cwd()
  const usedInCodePaths = readPathFile(
    joinUnlessAbsolute(cwd, args['used-in-code'])
  )
  const usedInTranslationPaths = readPathFile(
    joinUnlessAbsolute(cwd, args['used-in-translation'])
  )
  detectUnused(usedInCodePaths, usedInTranslationPaths)
}

if (require.main === module) {
  main()
}
