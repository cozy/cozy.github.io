#!/usr/bin/env node

require('isomorphic-fetch')
const fs = require('fs')
const appPackage = require('./package.json')
const path = require('path')
const { keyBy, sortBy } = require('lodash')
const spawnSync = require('child_process').spawnSync

const { ACH, importData, assert, log, askConfirmation } = require('./libs')
const runBatch = require('./libs/runBatch')
const scriptLib = require('./libs/scripts')
const parseDataFile = require('./libs/parseDataFile')
const getHandlebarsOptions = require('./libs/getHandlebarsOptions')
const { parseBool } = require('./libs/utils')

const DEFAULT_COZY_URL = 'http://cozy.tools:8080'

// Add promise rejection handling
process.on('unhandledRejection', function(err) {
  log.error('Unhandled promise rejection.\n' + err.stack)
})

function fileExists(p) {
  if (p && !fs.existsSync(path.resolve(p))) {
    return false
  } else {
    return true
  }
}

const logAndExit = e => {
  console.error(e)
  process.exit(1)
}

const handleImportCommand = args => {
  const { filepath, handlebarsOptionsFile, url } = args
  let { token } = args
  assert(fileExists(filepath), `${filepath} does not exist`)
  assert(
    fileExists(handlebarsOptionsFile),
    `${handlebarsOptionsFile} does not exist`
  )
  const options = { parallel: parseBool(process.env.ACH_PARALLEL, true) }
  const handlebarsOptions = getHandlebarsOptions(handlebarsOptionsFile, options)
  const templateDir = path.dirname(path.resolve(filepath))
  const data = parseDataFile(filepath, handlebarsOptions)
  const doctypes = Object.keys(data)
  token = token || autotoken(url, doctypes)
  return importData(url, token, data, templateDir, options).catch(logAndExit)
}

const handleImportDirCommand = args => {
  const { url } = args
  let { directoryPath, token } = args
  if (!directoryPath) directoryPath = './DirectoriesToInject'

  // get directories tree in JSON format
  const dirTree = require('directory-tree')
  const JSONtree = dirTree(directoryPath, {})

  const doctypes = ['io.cozy.files']
  token = token || autotoken(url, doctypes)
  const ach = new ACH(token, url, doctypes)
  ach
    .connect()
    .then(() => {
      return ach.importFolder(JSONtree)
    })
    .catch(logAndExit)
}

const handleGenerateFilesCommand = args => {
  const { path = '/', filesCount = 10, url, token } = args
  const ach = new ACH(token, url, ['io.cozy.files'])
  ach
    .connect()
    .then(() => {
      return ach.createFiles(path, parseInt(filesCount))
    })
    .catch(logAndExit)
}

const handleDropCommand = args => {
  console.log(args)
  const { doctypes, yes, url } = args
  let { token } = args
  token = token || autotoken(url, doctypes)

  const question = `This doctypes will be removed.

${doctypes.map(x => `* ${x}`).join(' \n')}

Type "yes" if ok.
`
  const confirm = yes
    ? function(question, cb) {
        cb()
      }
    : askConfirmation
  confirm(
    question,
    () => {
      const ach = new ACH(token, url, doctypes)
      ach
        .connect()
        .then(() => {
          return ach.dropCollections(doctypes)
        })
        .catch(logAndExit)
    },
    () => {
      console.log('Cancelled drop')
    }
  )
}

const handleExportCommand = args => {
  let { doctypes, filename, url, token } = args
  doctypes = doctypes.split(',') // should be done with type
  token = token || autotoken(url, doctypes)
  const ach = new ACH(token, url, doctypes)
  ach
    .connect()
    .then(() => {
      return ach.export(doctypes, filename)
    })
    .catch(logAndExit)
}

const handleUpdateSettingsCommand = args => {
  const { url, token } = args
  let { settings } = args
  settings = JSON.parse(settings) // should be done with type
  const ach = new ACH(token, url, ['io.cozy.settings'])
  ach
    .connect()
    .then(() => {
      return ach.updateSettings(settings)
    })
    .catch(logAndExit)
}

const handleGenerateTokenCommand = args => {
  const { url, token, doctypes } = args
  const ach = new ACH(token, url, doctypes)
  ach
    .connect()
    .then(() => {
      console.log(ach.client._token.token)
    })
    .catch(logAndExit)
}

const handleBatchCommand = async function(args) {
  const { scriptName, domainsFile, execute, fromDomain } = args
  let { poolSize, limit } = args
  const script = scriptLib.require(scriptName)
  try {
    limit = !isNaN(limit) ? limit : undefined
    poolSize = !isNaN(poolSize) ? poolSize : 30
    const dryRun = !execute
    await runBatch({
      script,
      domainsFile,
      limit,
      poolSize,
      dryRun,
      fromDomain
    })
  } catch (e) {
    console.error('Error during batch execution')
    console.error(e)
    process.exit(1)
  }
}

const handleScriptCommand = function(args) {
  const { scriptName, autotoken, execute, url } = args
  let { token } = args
  const script = scriptLib.require(scriptName)
  const { getDoctypes, run } = script
  const doctypes = getDoctypes()
  if (autotoken) {
    token = autotoken(url, doctypes)
  }

  const ach = new ACH(token, url, doctypes)
  const dryRun = !execute
  log.info(`Launching script ${scriptName}...`)
  log.info(`Dry run : ${dryRun}`)
  ach
    .connect()
    .then(() => {
      return run(ach, dryRun)
    })
    .catch(logAndExit)
}

const handleDownloadFileCommand = args => {
  const { url, fileid } = args
  let { token } = args
  const doctypes = ['io.cozy.files']
  token = token || autotoken(url, doctypes) // should be done with types
  const ach = new ACH(token, url, doctypes)
  ach
    .connect()
    .then(() => {
      return ach.downloadFile(fileid)
    })
    .catch(logAndExit)
}

const handleListScriptsCommand = function() {
  const scripts = scriptLib.list()
  console.log(scripts.join('\n'))
}

const isCommandAvailable = command => {
  try {
    const spawned = spawnSync('which', [command], {
      stdio: 'pipe'
    })
    return spawned.stdout.length > 0
  } catch (err) {
    return false
  }
}

const handleDeleteDocumentsCommand = args => {
  const { url, token, doctype, ids } = args
  const ach = new ACH(token, url, [doctype])
  ach
    .connect()
    .then(() => {
      return ach.deleteDocuments(doctype, ids)
    })
    .catch(logAndExit)
}

const makeToken = (url, doctypes) => {
  const args = [url.replace(/https?:\/\//, ''), ...doctypes]
  const spawned = spawnSync('make-token', args, {
    stdio: 'pipe',
    encoding: 'utf-8'
  })
  let token = null
  if (spawned.stdout) {
    token = spawned.stdout.split('\n')[0]
  }
  if (token) {
    log.info('Made token automatically: ' + token)
  } else {
    log.info('Could not automatically create token')
    log.debug(spawned.stderr)
  }
  return token
}

const autotoken = (url, doctypes) => {
  if (isCommandAvailable('make-token') && url.indexOf('cozy.tools') === -1) {
    return makeToken(url, doctypes)
  }
}

// the CLI interface
let program = require('commander')
program
  .version(appPackage.version)
  .option('-t --token [token]', 'Token file to use')
  .option('-y --yes', 'Does not ask for confirmation on sensitive operations')
  .option(
    '-u --url [url]',
    `URL of the cozy to use. Defaults to "${DEFAULT_COZY_URL}".'`,
    DEFAULT_COZY_URL
  )

program
  .command('import <filepath> [handlebarsOptionsFile]')
  .description(
    'The file containing the JSON data to import. Defaults to "example-data.json". Then the dummy helpers JS file (optional).'
  )
  .action(async function(filepath, handlebarsOptionsFile) {
    await handleImportCommand({
      url: program.url,
      token: program.token,
      filepath,
      handlebarsOptionsFile
    })
  })

program
  .command('importDir <directoryPath>')
  .description(
    'The path to the directory content to import. Defaults to "./DirectoriesToInject".'
  )
  .action(async function(directoryPath) {
    await handleImportDirCommand({
      url: program.url,
      token: program.token,
      directoryPath
    })
  })

program
  .command('generateFiles [path] [filesCount]')
  .description('Generates a given number of small files.')
  .action(function(path, filesCount) {
    handleGenerateFilesCommand({ path, filesCount })
  })

program
  .command('drop <doctypes...>')
  .option('-y, --yes', 'Do not ask for confirmation')
  .description('Deletes all documents of the provided doctypes. For real.')
  .action(async function(doctypes) {
    await handleDropCommand({
      url: program.url,
      token: program.token,
      doctypes,
      yes: program.yes
    })
  })

program
  .command('export <doctypes> [filename]')
  .description(
    'Exports data from the doctypes (separated by commas) to filename'
  )
  .action(async function(doctypes, filename) {
    await handleExportCommand({
      url: program.url,
      token: program.token,
      doctypes,
      filename
    })
  })

program
  .command('downloadFile <fileid>')
  .description('Download the file')
  .action(async function(fileid) {
    await handleDownloadFileCommand({
      url: program.url,
      token: program.token,
      fileid
    })
  })

program
  .command('delete <doctype> <ids...>')
  .description('Delete document(s)')
  .action(function(doctype, ids) {
    handleDeleteDocumentsCommand({
      url: program.url,
      token: program.token,
      doctype,
      ids
    })
  })

program
  .command('updateSettings')
  .description('Update settings')
  .action(async function(settings) {
    await handleUpdateSettingsCommand({
      url: program.url,
      token: program.token,
      settings
    })
  })

program
  .command('token <doctypes...>')
  .description('Generate token')
  .action(function(doctypes) {
    handleGenerateTokenCommand({
      doctypes
    })
  })

program
  .command('script <scriptName>')
  .option('--autotoken', 'Automatically generate the permission token')
  .option('-x, --execute', 'Execute the script (disable dry run)')
  .option('-d, --doctypes', 'Print necessary doctypes (useful for automation)')
  .description('Launch script')
  .action(async function(scriptName, action) {
    await handleScriptCommand({
      url: program.url,
      token: program.token,
      scriptName,
      ...action
    })
  })

program
  .command('ls-scripts')
  .description('Lists all built-in scripts, useful for autocompletion')
  .action(handleListScriptsCommand)

program
  .command('batch <scriptName> <domainsFile>')
  .option('-l, --limit <n>', 'Only take limit instances from the file', x =>
    parseInt(x, 10)
  )
  .option(
    '--fromDomain <domain>',
    'Only consider <domainsFile> from <domain>. Useful for unfinished jobs.'
  )
  .option(
    '-p, --pool-size <n>',
    'Limit the number of instances on which we execute the script at the same time',
    x => parseInt(x, 10)
  )
  .option('-x, --execute', 'Execute the script (disable dry run)')
  .description('Launch script')
  .action(async function(scriptName, domainsFile, action) {
    await handleBatchCommand({
      url: program.url,
      token: program.token,
      scriptName,
      domainsFile,
      ...action
    })
  })

const findCommand = program => {
  const lastArg = program.args[program.args.length - 1]
  if (lastArg instanceof program.Command) {
    return lastArg._name
  } else {
    return program.args[0]
  }
}

const main = async () => {
  program.parse(process.argv)
  // Check for unknown commands
  const commands = keyBy(program.commands, '_name')
  const command = findCommand(program)
  if (!commands[command]) {
    if (command) {
      console.log(`Unknown command "${command}"`)
    } else {
      console.log('You must pass a command to ACH')
    }
    const availableCommands = sortBy(Object.keys(commands)).join(', ')
    console.log(`Available commands: ${availableCommands}`)
    console.log('Use `ACH --help` to have more help.')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
