import { defineConfig, mergeRsbuildConfig } from '@rsbuild/core'
import { getRsbuildConfig } from 'rsbuild-config-cozy-app'

const config = getRsbuildConfig({
  title: 'Twake Home',
  hasServices: true,
  hasIntents: true
})

const mergedConfig = mergeRsbuildConfig(config, {
  resolve: {
    alias: {
      // cozy-viewer requires the CommonJS build of react-pdf. Both builds
      // reset the pdf.js worker on load, so keep a single one or it
      // overwrites the worker set up in src/lib/pdfjsWorker.js.
      'react-pdf$': 'react-pdf/dist/esm/index.js',
      // The legacy build polyfills Promise.withResolvers, missing before
      // Safari 17.4, in both the main thread and the worker.
      'pdfjs-dist$': 'pdfjs-dist/legacy/build/pdf.mjs'
    }
  },
  tools: {
    rspack: {
      module: {
        rules: [
          {
            // react-pdf declares no side effects, yet its index resets the
            // pdf.js worker. Run it before src/lib/pdfjsWorker.js sets ours.
            test: /react-pdf[\\/]dist[\\/]esm[\\/]index\.js$/,
            sideEffects: true
          }
        ]
      }
    }
  }
})

export default defineConfig(mergedConfig)
