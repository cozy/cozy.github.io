const deleteDocuments = require('./deleteDocuments')
const dropCollections = require('./dropCollections')
const importFolderContent = require('./importFolderContent')
const createFiles = require('./createFiles')
const exportData = require('./exportData')
const getClient = require('./getClient')
const cozyFetch = require('./cozyFetch')
const log = require('./log')
const request = require('request')
const fs = require('fs')
const { createClientInteractive } = require('cozy-client/dist/cli')

const { handleBadToken } = require('../libs/utils')

const hashCode = function(str) {
  var hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString(16)
}

const getTokenPath = function(url, doctypes) {
  const key =
    url +
    ':' +
    doctypes
      .slice()
      .sort()
      .join(',')
  return '/tmp/.ach-token-' + hashCode(key) + '.json'
}

class ACH {
  constructor(token, url, doctypes) {
    this.url = url
    this.doctypes = doctypes
    this.token = token || getTokenPath(url, doctypes)
  }

  async connect() {
    log.debug('Connecting to ' + this.url)
    try {
      /* NOTE: in the future, we expect to only use cozy-client */
      this.client = await getClient(this.token, this.url, this.doctypes)
      this.cozyClient = await createClientInteractive({
        uri: this.url,
        scope: this.doctypes,
        oauth: {
          softwareID: 'ACH'
        }
      })
    } catch (err) {
      log.warn('Could not connect to' + this.url)
      throw err
    }
  }

  async downloadFile(id) {
    log.debug('Making download link for ' + id)
    const downloadLink = await this.client.files.getDownloadLinkById(id)
    const fileUrl = this.url + downloadLink
    log.debug('Download link is ' + fileUrl)
    const filename = fileUrl.split('/').slice(-1)[0]
    const stream = fs.createWriteStream(filename)
    await new Promise((resolve, reject) => {
      log.debug('Downloading...')
      request(fileUrl)
        .pipe(stream)
        .on('finish', resolve)
        .on('error', reject)
    })
    log.info(`Downloaded ${filename} successfully`)
  }
}

const updateSettings = function(client, attrs) {
  let instance
  return this.fetch('GET', '/settings/instance')
    .then(data => {
      instance = data
      instance.data.attributes = Object.assign(
        {},
        instance.data.attributes,
        attrs
      )
      return this.fetch('PUT', '/settings/instance', instance)
    })
    .then(settings => {
      log.info(
        'Updated settings\n',
        JSON.stringify(settings.data.attributes, null, 2)
      )
    })
}

const methods = {
  deleteDocuments,
  dropCollections,
  importFolder: importFolderContent,
  createFiles,
  export: exportData,
  fetch: cozyFetch,
  updateSettings: updateSettings
}

Object.keys(methods).forEach(name => {
  const method = methods[name]
  ACH.prototype[name] = function() {
    if (!this.client) {
      throw new Error('You need to call connect() before using ' + name)
    }
    const args = [].slice.call(arguments)
    args.unshift(this.client)
    return handleBadToken(method.apply(this, args))
  }
})

module.exports = ACH
