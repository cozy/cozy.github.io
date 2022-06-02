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
const urls = require('url')

const DEFAULT_COZY_URL = 'http://cozy.localhost:8080'

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

const handleErrors = fn =>
  async function() {
    try {
      await fn.apply(this, arguments)
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  }

const handleImportCommand = args => {
  const { handlebarsOptionsFile, url } = args
  let { filepath, token } = args
  try {
    assert(fileExists(filepath), `${filepath} does not exist`)
  } catch (error) {
    const achFilepath = path.join(__dirname, './data', filepath)
    if (fileExists(achFilepath)) {
      filepath = achFilepath
    } else {
      throw error
    }
  }
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
  return importData(url, token, data, templateDir, options)
}

const handleImportDirCommand = async args => {
  const { url } = args
  let { directoryPath, token } = args
  if (!directoryPath) directoryPath = './DirectoriesToInject'

  // get directories tree in JSON format
  const dirTree = require('directory-tree')
  const JSONtree = dirTree(directoryPath, {})

  const doctypes = ['io.cozy.files']
  token = token || autotoken(url, doctypes)
  const ach = new ACH(token, url, doctypes)
  await ach.connect()
  await ach.importFolder(JSONtree)
}

const handleGenerateFilesCommand = async args => {
  const { path = '/', filesCount = 10, url, token } = args
  const ach = new ACH(token, url, ['io.cozy.files'])
  await ach.connect()
  await ach.createFiles(path, parseInt(filesCount))
}

const handleDropCommand = async args => {
  const { doctypes, yes, url } = args
  let { token } = args
  token = token || autotoken(url, doctypes)

  const question = `This doctypes will be removed.

${doctypes.map(x => `* ${x}`).join(' \n')}

Type "yes" if ok.
`
  const confirmation = yes ? Promise.resolve() : askConfirmation(question)

  try {
    await confirmation
  } catch (e) {
    console.log('Cancelled drop')
    return
  }

  const ach = new ACH(token, url, doctypes)
  await ach.connect()
  await ach.dropCollections(doctypes)
}

const handleExportCommand = async args => {
  let { doctypes, filename, url, token, last } = args
  doctypes = doctypes.split(',') // should be done with type
  token = token || autotoken(url, doctypes)
  const ach = new ACH(token, url, doctypes)
  await ach.connect()
  await ach.export(doctypes, filename, last)
}

const handleUpdateSettingsCommand = async args => {
  const { url, token } = args
  let { settings } = args
  settings = JSON.parse(settings) // should be done with type
  const ach = new ACH(token, url, ['io.cozy.settings'])
  await ach.connect()
  await ach.updateSettings(settings)
}

const handleGenerateTokenCommand = async args => {
  const { url, token, doctypes } = args
  const ach = new ACH(token, url, doctypes)
  await ach.connect()
  console.log(ach.client.stackClient.token.token)
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
    throw e
  }
}

const handleScriptCommand = async args => {
  const { scriptName, autotoken, execute, url, parameters } = args
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
  await ach.connect()
  await run(ach, dryRun, parameters)
}

const handleDownloadFileCommand = async args => {
  const { url, fileid } = args
  let { token } = args
  const doctypes = ['io.cozy.files']
  token = token || autotoken(url, doctypes) // should be done with types
  const ach = new ACH(token, url, doctypes)
  await ach.connect()
  await ach.downloadFile(fileid)
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

const handleDeleteDocumentsCommand = async args => {
  const { url, token, doctype, ids } = args
  const ach = new ACH(token, url, [doctype])
  await ach.connect()
  await ach.deleteDocuments(doctype, ids)
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

/**
 * Removes the "app" part in a cozy URL
 *
 * This is useful for ergonomics as users often copy/paste an
 * URL contaning the app
 *
 * input: https://moncozy-drive.mycozy.cloud
 * ouput: https://moncozy.mycozy.cloud
 */
const parseCozyURL = stringUrl => {
  const parsedUrl = urls.parse(stringUrl)
  const splittedHost = parsedUrl.host.split('.')
  parsedUrl.host = `${splittedHost[0].split('-')[0]}.${splittedHost
    .slice(1)
    .join('.')}`
  // Using url module has a side effect: it adds a / at the end
  // We remove it because it breaks make-token
  return urls.format(parsedUrl).replace(/\/$/, '')
}
exports.parseCozyURL = parseCozyURL

// the CLI interface
let program = require('commander')
program
  .version(appPackage.version)
  .option('-t --token [token]', 'Token file to use')
  .option('-y --yes', 'Does not ask for confirmation on sensitive operations')
  .option(
    '-u --url [url]',
    `URL of the cozy to use. Defaults to "${DEFAULT_COZY_URL}".'`,
    parseCozyURL,
    DEFAULT_COZY_URL
  )

program
  .command('import <filepath> [handlebarsOptionsFile]')
  .description(
    'The file containing the JSON data to import. Defaults to "example-data.json". If the file doesn\'t exist in the application, ACH will try to find it inside its data folder. Then the dummy helpers JS file (optional).'
  )
  .action(
    handleErrors(async function(filepath, handlebarsOptionsFile) {
      await handleImportCommand({
        url: program.url,
        token: program.token,
        filepath,
        handlebarsOptionsFile
      })
    })
  )

program
  .command('importDir <directoryPath>')
  .description(
    'The path to the directory content to import. Defaults to "./DirectoriesToInject".'
  )
  .action(
    handleErrors(async function(directoryPath) {
      await handleImportDirCommand({
        url: program.url,
        token: program.token,
        directoryPath
      })
    })
  )

program
  .command('generateFiles [path] [filesCount]')
  .description('Generates a given number of small files.')
  .action(
    handleErrors(async function(path, filesCount) {
      await handleGenerateFilesCommand({
        url: program.url,
        token: program.token,
        path,
        filesCount
      })
    })
  )

program
  .command('drop <doctypes...>')
  .option('-y, --yes', 'Do not ask for confirmation')
  .description('Deletes all documents of the provided doctypes. For real.')
  .action(
    handleErrors(async function(doctypes) {
      await handleDropCommand({
        url: program.url,
        token: program.token,
        doctypes,
        yes: program.yes
      })
    })
  )

program
  .command('export <doctypes> [filename]')
  .option(
    '-l, --last <n>',
    'Retrieve only the last documents, sorted by updated date',
    x => parseInt(x, 10)
  )
  .description(
    'Exports data from the doctypes (separated by commas) to filename'
  )
  .action(
    handleErrors(async function(doctypes, filename, options) {
      await handleExportCommand({
        url: program.url,
        token: program.token,
        doctypes,
        filename,
        ...options
      })
    })
  )

program
  .command('downloadFile <fileid>')
  .description('Download the file')
  .action(
    handleErrors(async function(fileid) {
      await handleDownloadFileCommand({
        url: program.url,
        token: program.token,
        fileid
      })
    })
  )

program
  .command('delete <doctype> <ids...>')
  .description('Delete document(s)')
  .action(
    handleErrors(async function(doctype, ids) {
      await handleDeleteDocumentsCommand({
        url: program.url,
        token: program.token,
        doctype,
        ids
      })
    })
  )

program
  .command('updateSettings')
  .description('Update settings')
  .action(
    handleErrors(async function(settings) {
      await handleUpdateSettingsCommand({
        url: program.url,
        token: program.token,
        settings
      })
    })
  )

program
  .command('token <doctypes...>')
  .description('Generate token')
  .action(
    handleErrors(async function(doctypes) {
      await handleGenerateTokenCommand({
        url: program.url,
        doctypes
      })
    })
  )

program
  .command('script <scriptName>')
  .arguments(
    '[params...]',
    'A list of parameters to be passed to the script, separated by a space'
  )
  .option('--autotoken', 'Automatically generate the permission token')
  .option('-x, --execute', 'Execute the script (disable dry run)')
  .option('-d, --doctypes', 'Print necessary doctypes (useful for automation)')
  .description('Launch script')
  .action(
    handleErrors(async function(scriptName, parameters, action) {
      await handleScriptCommand({
        url: program.url,
        token: program.token,
        scriptName,
        parameters,
        ...action
      })
    })
  )

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
  .action(
    handleErrors(async function(scriptName, domainsFile, action) {
      await handleBatchCommand({
        url: program.url,
        token: program.token,
        scriptName,
        domainsFile,
        ...action
      })
    })
  )

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
