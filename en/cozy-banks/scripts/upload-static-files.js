#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import { launchCmd } from './helpers'

const COZY_URL = 'downcloud.cozycloud.cc'

async function getPathsToUpload() {
  const fileContent = await fs.readFile(
    path.resolve(__dirname, '../static-files.txt'),
    'utf-8'
  )

  const pathsToUpload = fileContent
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [from, to] = line.split(' ')

      return { from, to }
    })

  return pathsToUpload
}

function upload({ from, to }) {
  const fromAbsPath = path.resolve(__dirname, `../${from}`) + '/'
  const toAbsPath = `upload@${COZY_URL}:/home/upload/www-upload/cozy-banks/${to}`

  console.log('Upload ', fromAbsPath, ' to ', toAbsPath)

  return launchCmd(
    'rsync',
    [
      '-e', 'ssh -o StrictHostKeyChecking=no',
      '-ar', path.resolve(__dirname, `../${from}`) + '/', `upload@${COZY_URL}:/home/upload/www-upload/cozy-banks/${to}`
    ]
  )
}

async function main() {
  try {
    const pathsToUpload = await getPathsToUpload()
    await Promise.all(pathsToUpload.map(upload))

    console.log('Every static file has been uploaded successfully')
  } catch (e) {
    console.log('Error while uploading static files')
    console.log(e)
  }
}

main()
