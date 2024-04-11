#!/usr/bin/env node

'use strict'

const { ArgumentParser } = require('argparse')
const capitalize = require('lodash/capitalize')
const omitBy = require('lodash/omitBy')

const logger = require('./utils/logger')
const colorize = require('./utils/colorize')
const scripts = require('./index')

const pkg = require('../package.json')

const MODES = {
  TRAVIS: 'travis',
  MANUAL: 'manual'
}

const parser = new ArgumentParser({
  version: pkg.version,
  description:
    'This tool allows you to publish a Cozy application to the Cozy registry.'
})
parser.addArgument('--token', {
  metavar: 'editor-token',
  help: 'Registry token matching the provided editor (required)'
})
parser.addArgument('--space', {
  metavar: 'space-name',
  help: 'Registry space name to publish the application to (default __default__)'
})
parser.addArgument('--build-dir', {
  metavar: 'relative-path',
  dest: 'buildDir',
  help: 'Path of the build directory relative to the current directory (default ./build)'
})
parser.addArgument('--build-url', {
  metavar: 'url',
  dest: 'buildUrl',
  help: 'URL of the application archive'
})
parser.addArgument('--build-commit', {
  metavar: 'commit-hash',
  dest: 'buildCommit',
  help: 'Hash of the build commit matching the build archive to publish'
})
parser.addArgument('--manual-version', {
  metavar: 'version',
  dest: 'manualVersion',
  help: 'Specify a version manually (must not be already published in the registry)'
})
parser.addArgument('--prepublish', {
  metavar: 'script-path',
  help: 'Hook to process parameters just before publishing, typically to upload archive on custom host'
})
parser.addArgument('--postpublish', {
  metavar: 'script-path',
  help: 'Hook to process parameters just after publishing, typically to deploy app'
})
parser.addArgument('--tag-prefix', {
  metavar: 'tag-prefix',
  dest: 'tagPrefix',
  help: 'When publishing from a monorepo, only consider tags with tagPrefix, ex: cozy-banks/1.0.1.'
})
parser.addArgument('--registry-url', {
  metavar: 'url',
  dest: 'registryUrl',
  help: 'Registry URL to publish to a different one from the default URL'
})
parser.addArgument('--yes', {
  help: 'Force confirmation when publishing manually',
  action: 'storeTrue'
})
parser.addArgument('--verbose', {
  help: 'print additional logs',
  action: 'storeTrue'
})
parser.addArgument('--mode', {
  help: 'Override the publication mode (default: manual)',
  choices: Object.values(MODES)
})

const handleError = error => {
  logger.error(colorize.red(`Publishing failed: ${error.message}`))
  process.exit(1)
}

try {
  // ignore null value which are defaults to argparse (instead of undefined).
  // null values break lodash/defaults
  const args = omitBy(parser.parseArgs(), val => val === null)
  publishApp(args).catch(handleError)
} catch (error) {
  handleError(error)
}

function _getPublishMode(mode) {
  if (mode) {
    return mode
  } else if (process.env.TRAVIS === 'true') {
    return MODES.TRAVIS
  } else {
    // default mode
    return MODES.MANUAL
  }
}

async function publishApp(cliOptions) {
  const publishMode = _getPublishMode(cliOptions.mode)
  const publishFn = scripts[publishMode]

  logger.log(
    `${colorize.bold(capitalize(publishMode))} ${colorize.blue('publish mode')}`
  )

  return publishFn({
    appBuildUrl: cliOptions.buildUrl,
    buildCommit: cliOptions.buildCommit,
    buildDir: cliOptions.buildDir,
    buildUrl: cliOptions.buildUrl,
    manualVersion: cliOptions.manualVersion,
    postpublishHook: cliOptions.postpublish,
    prepublishHook: cliOptions.prepublish,
    registryToken: cliOptions.token,
    registryUrl: cliOptions.registryUrl,
    spaceName: cliOptions.space,
    tagPrefix: cliOptions.tagPrefix,
    verbose: cliOptions.verbose,
    yes: cliOptions.yes
  })
}
