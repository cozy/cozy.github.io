const CozyClient = require('cozy-client').default

const deleteDocuments = require('./deleteDocuments')
const dropCollections = require('./dropCollections')
const importFolderContent = require('./importFolderContent')
const createFiles = require('./createFiles')
const { exportDocs, exportSingleDoc } = require('./exportData')
const getClient = require('./getClient')
const cozyFetch = require('./cozyFetch')
const log = require('./log')
const request = require('request')
const fs = require('fs')
const path = require('path')
const os = require('os')

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
  return path.join(os.tmpdir(), '.ach-token-' + hashCode(key) + '.json')
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
      this.oldClient = await getClient(this.token, this.url, this.doctypes)
      this.client = CozyClient.fromOldClient(this.oldClient)
    } catch (err) {
      log.warn('Could not connect to ' + this.url)
      log.warn(
        'You can specify the Cozy URL by using the --url argument: ACH --url http://bob.cozy.localhost:8080 '
      )

      if (this.url.includes('localhost')) {
        log.warn(
          `Seems like you are trying to connecto to a localhost server, please verify that this domain is declared in your system's hosts file (i.e. '127.0.0.1 bob.cozy.localhost')`
        )
      }

      throw err
    }
  }

  async downloadFile(id) {
    log.debug('Making download link for ' + id)
    const downloadLink = await this.oldClient.files.getDownloadLinkById(id)
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
  deleteDocuments: {
    method: deleteDocuments,
    oldClient: true
  },
  dropCollections: {
    method: dropCollections,
    oldClient: false
  },
  importFolder: {
    method: importFolderContent,
    oldClient: true
  },
  createFiles: {
    method: createFiles,
    oldClient: true
  },
  export: {
    method: exportDocs,
    oldClient: false
  },
  exportSingle: {
    method: exportSingleDoc,
    oldClient: false
  },
  fetch: {
    method: cozyFetch,
    oldClient: true
  },
  updateSettings: {
    method: updateSettings,
    oldClient: true
  }
}

Object.keys(methods).forEach(name => {
  const methodOptions = methods[name]
  const method = methodOptions.method
  ACH.prototype[name] = function() {
    if (!this.client) {
      throw new Error('You need to call connect() before using ' + name)
    }
    const args = [].slice.call(arguments)
    args.unshift(methodOptions.oldClient ? this.oldClient : this.client)
    return handleBadToken(method.apply(this, args))
  }
})

module.exports = ACH
