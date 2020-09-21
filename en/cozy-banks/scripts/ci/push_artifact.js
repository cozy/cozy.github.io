#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require('fs-extra')
const path = require('path')
const tar = require('tar')
const { spawn } = require('child_process')

const DOWNCLOUD_UPLOAD_DIR = 'www-upload/'
const DOWNCLOUD_URL = 'downcloud.cozycloud.cc'

const launchCmd = (cmd, params, options) => {
  return new Promise((resolve, reject) => {
    const result = { stdout: [], stderr: [] }
    const cmdOptions = { encoding: 'utf8', ...options }
    const process = spawn(cmd, params, cmdOptions)
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

/** Updates version in manifest.webapp to add commit sha and Travis build id */
const updateVersion = async folderName => {
  const buildCommit = process.env.TRAVIS_COMMIT
  const TRAVIS_BUILD_DIR = process.env.TRAVIS_BUILD_DIR
  const TRAVIS_BUILD_ID = process.env.TRAVIS_BUILD_ID

  const pathToManifest = path.join(
    TRAVIS_BUILD_DIR,
    folderName,
    'manifest.webapp'
  )
  const appManifestObj = fs.readJSONSync(pathToManifest)
  const appVersion = `${appManifestObj.version}-dev.${buildCommit}-${TRAVIS_BUILD_ID}`
  appManifestObj.version = appVersion
  console.warn(`↳ ℹ️  Updating manifest version to ${appVersion}`)

  fs.writeFileSync(pathToManifest, JSON.stringify(appManifestObj))
}

const createArchive = async (folderName, archiveFileName) => {
  console.warn(`↳ ℹ️  Creating archive ${folderName}/${archiveFileName}`)
  await updateVersion(folderName)
  const fileList = await fs.readdir(folderName)
  const options = {
    gzip: true,
    cwd: folderName,
    file: folderName + '/' + archiveFileName
  }
  try {
    await tar.c(options, fileList)
  } catch (error) {
    console.error(
      `↳ ❌ Unable to generate app archive. Is tar installed as a dependency ? Error : ${error.message}`
    )
    throw new Error('Unable to generate archive')
  }
}

const pushArtifact = async (fileName, parentFolder, options) => {
  const { appSlug, appVersion, buildCommit } = options
  console.warn(`↳ ℹ️  Sending artifact to downcloud`)
  const folder = `${appSlug}/mobile/${appVersion}${
    buildCommit ? `-${buildCommit}` : ''
  }/`
  try {
    await launchCmd('ssh', [
      '-o',
      'StrictHostKeyChecking=no',
      'upload@downcloud.cozycloud.cc',
      `mkdir -p ${DOWNCLOUD_UPLOAD_DIR}${folder}`
    ])
  } catch (e) {
    throw new Error(
      `Unable to create target directory ${folder} on downcloud server : ${e.message}`
    )
  }

  await launchCmd(
    'rsync',
    [
      // to remove host validation question on CI
      '-e',
      'ssh -o StrictHostKeyChecking=no',
      '-a',
      fileName,
      `upload@${DOWNCLOUD_URL}:${DOWNCLOUD_UPLOAD_DIR}${folder}`
    ],
    { cwd: parentFolder }
  )

  console.warn(`↳ ℹ️  Upload to downcloud complete.`)
  return {
    ...options,
    appBuildUrl: `https://${DOWNCLOUD_URL}/upload/${folder}${fileName}`
  }
}

const getUploadTarget = async (uploadTarget, appName) => {
  if (!fs.existsSync(uploadTarget)) {
    throw new Error(`❌ ${uploadTarget} does not exist.`)
  } else if (fs.lstatSync(uploadTarget).isDirectory()) {
    const archiveFileName = `${appName.toLowerCase()}.tar.gz`
    await createArchive(uploadTarget, archiveFileName)

    return [uploadTarget, archiveFileName]
  } else {
    const uploadDir = path.dirname(uploadTarget)
    const uploadFile = path.basename(uploadTarget)

    return [uploadDir, uploadFile]
  }
}

const readManifest = () => {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../manifest.webapp')).toString()
  )
}

;(async () => {
  try {
    const uploadTarget = process.argv[2]
    const { version, name } = readManifest()

    const [uploadDir, uploadFile] = await getUploadTarget(uploadTarget, name)

    const { appBuildUrl } = await pushArtifact(uploadFile, uploadDir, {
      appSlug: name,
      appVersion: version,
      buildCommit: process.env.TRAVIS_COMMIT
    })
    console.warn(`↳ ✅ Upload complete, artifact available at ${appBuildUrl}`)
    console.log(appBuildUrl)
  } catch (error) {
    console.error(`↳ ❌  Error while uploading: ${error.message}`)
    process.exit(1)
  }
})()
