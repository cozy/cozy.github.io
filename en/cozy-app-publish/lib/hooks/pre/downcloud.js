#!/usr/bin/env node

const fs = require('fs-extra')
const tar = require('tar')
const { spawn } = require('child_process')

const BUILD_FOLDER = './build/'
const DOWNCLOUD_URL = 'downcloud.cozycloud.cc'

const launchCmd = (cmd, params, options) => {
  return new Promise(async (resolve, reject) => {
    const result = { stdout: [], stderr: [] }
    const cmdOptions = { encoding: 'utf8', ...options }
    const process = await spawn(cmd, params, cmdOptions)
    process.stdout.on('data', data => result.stdout.push(data.toString()))
    process.stderr.on('data', data => result.stderr.push(data.toString()))
    process.on('close', code => {
      result.code = code
      if (code === 0) {
        resolve(result.stdout.join(''))
      } else {
        reject(new Error(result.stderr.join('')))
      }
    })
  })
}

const deleteArchive = async filename => {
  try {
    await fs.remove(BUILD_FOLDER + filename)
  } catch (error) {
    console.error(`↳ ⚠️  Unable to delete the previous archive.`)
  }
}

const pushArchive = async (archiveFileName, options) => {
  const { appSlug, appVersion, buildCommit } = options
  console.log(`↳ ℹ️  Sending archive to downcloud`)
  const folder = `www-upload/${appSlug}/${appVersion}-${buildCommit}/`
  try {
    await launchCmd('ssh', [
      '-o',
      'StrictHostKeyChecking=no',
      'upload@downcloud.cozycloud.cc',
      `mkdir -p ${folder}`
    ])
  } catch (e) {
    throw new Error(
      `Unable to create target directory ${folder} on downcloud server : ${
        e.message
      }`
    )
  }

  await launchCmd(
    'rsync',
    [
      // to remove host validation question on CI
      '-e',
      'ssh -o StrictHostKeyChecking=no',
      '-a',
      archiveFileName,
      `upload@${DOWNCLOUD_URL}:${folder}`
    ],
    { cwd: BUILD_FOLDER }
  )

  console.log(`↳ ℹ️  Upload to downcloud complete.`)

  return {
    ...options,
    appBuildUrl: `https://${DOWNCLOUD_URL}/upload/${appSlug}/${appVersion}-${buildCommit}/${archiveFileName}`
  }
}

const getArchiveFileName = slug => {
  return `${slug}.tar.gz`
}

const createArchive = async archiveFileName => {
  console.log(`↳ ℹ️  Creating archive ${archiveFileName}`)
  const fileList = await fs.readdir(BUILD_FOLDER)
  const options = {
    gzip: true,
    cwd: BUILD_FOLDER,
    file: BUILD_FOLDER + archiveFileName
  }
  try {
    await tar.c(options, fileList)
  } catch (error) {
    console.error(
      `↳ ❌ Unable to generate app archive. Is tar installed as a dependency ? Error : ${
        error.message
      }`
    )
    throw new Error('Unable to generate archive')
  }
}

module.exports = async options => {
  if (!fs.existsSync(BUILD_FOLDER)) {
    console.error('↳ ❌  Build folder does not exist. Run `yarn build`.')
    throw new Error('Missing build folder')
  }

  const { appSlug } = options

  const archiveFileName = getArchiveFileName(appSlug)
  await deleteArchive(archiveFileName)
  await createArchive(archiveFileName)

  let downcloudOptions = options

  try {
    downcloudOptions = await pushArchive(archiveFileName, downcloudOptions)
  } catch (error) {
    console.error(`↳ ❌  Error while uploading: ${error.message}`)
    throw new Error('Downcloud publishing error')
  }

  return downcloudOptions
}
