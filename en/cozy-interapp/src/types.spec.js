import path from 'path'

import ts from 'typescript'

const root = path.join(__dirname, '..')
const options = {
  strict: true,
  noEmit: true,
  esModuleInterop: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2020,
  lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
  types: []
}

// The errors of a client written against index.d.ts
const typeErrors = source => {
  const file = path.join(root, 'client-check.ts')
  const host = ts.createCompilerHost(options)
  const getSourceFile = host.getSourceFile
  host.getSourceFile = (name, ...rest) =>
    name === file
      ? ts.createSourceFile(name, source, ts.ScriptTarget.ES2020)
      : getSourceFile(name, ...rest)
  const program = ts.createProgram([file], options, host)
  return ts
    .getPreEmitDiagnostics(program)
    .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText))
}

describe('index.d.ts', () => {
  it('types a client and a service', () => {
    expect(
      typeErrors(`
        import Intents, { type StartedIntent } from './index'

        const intents = new Intents({
          fetch: (method, path, body) => Promise.resolve({ method, path, body })
        })
        const started: StartedIntent = intents
          .create('PICK', 'io.cozy.files', { multiple: true })
          .start(document.body, {
            readyTimeout: 30000,
            title: 'Pick a file',
            className: 'u-w-100',
            focus: false,
            onServiceReady: () => undefined,
            onResult: (result: unknown) => result
          })
        started.sendData({ multiple: false })
        started.then(doc => doc).finally(() => started.stop())

        new Intents({
          client: { stackClient: { fetchJSON: (method: string) => Promise.resolve(method) } }
        })
      `)
    ).toEqual([])

    expect(
      typeErrors(`
        import { Intents } from './index'

        const intents = new Intents({ fetch: () => Promise.resolve(null) })
        void intents.createService()
        // The call of the README
        void intents
          .createService(null, window, { requireFrameAncestors: true })
          .then(service => {
            service.onData(data => data)()
            service.sendResult({ text: 'hello' })
            service.terminate({ id: '1' })
          })
      `)
    ).toEqual([])
  })

  it('refuses an unknown option', () => {
    expect(
      typeErrors(`
        import Intents from './index'

        new Intents({ fetch: () => Promise.resolve(null) })
          .create('PICK', 'io.cozy.files')
          .start(document.body, { readyTimout: 30000 })
      `)
    ).toHaveLength(1)
  })
})
