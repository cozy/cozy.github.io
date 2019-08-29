const webpack = require('webpack')
const { CachedInputFileSystem, ResolverFactory } = require('enhanced-resolve')
const fs = require('fs')

const pluginName = 'PackageVersionPlugin'

class VersionPlugin {
  constructor(options) {
    this.varName = options.varName || '__VERSIONS__'
    this.packages = options.packages
  }
  async apply(compiler) {
    // Create a resolver with the same options as the compiler
    const resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs, 4000),
      extensions: ['.json'],
      modules: compiler.options.resolve.modules
    })
    // We need to get the versions before the compilation because we will use
    // the DefinePlugin that is run at the `compilation` stage
    compiler.hooks.beforeCompile.tapAsync(
      pluginName,
      async (params, callback) => {
        // Collect versions of all packages specified in options
        const versions = {}
        for (let pkg of this.packages) {
          const path = await resolvePromise(resolver, `${pkg}/package.json`)
          const version = JSON.parse(fs.readFileSync(path)).version
          versions[pkg] = version
        }
        const definitions = {}
        definitions[this.varName] = JSON.stringify(versions)

        // Create a DefinePlugin and apply it to the compiler
        const df = new webpack.DefinePlugin(definitions)
        df.apply(compiler)
        callback()
      }
    )
  }
}

const resolvePromise = (resolver, request) =>
  new Promise((resolve, reject) => {
    const resolveContext = {}
    resolver.resolve(
      {},
      __dirname,
      request,
      resolveContext,
      (err, filepath) => (err && reject(err)) || resolve(filepath)
    )
  })

module.exports = VersionPlugin
