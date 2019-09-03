const doNotThrowOn404 = function(method) {
  return function() {
    return method.apply(this, arguments).catch(err => {
      if (err && err.response && err.response.status === 404) {
        return false
      }
      throw err
    })
  }
}

const forceCreateDoc = function(client, doctype, data) {
  const create = () => {
    return client.data.create(doctype, data)
  }
  if (data._id) {
    return client.data
      .existsById(doctype, data._id)
      .then(exists => {
        return exists ? client.data.delete(doctype, exists) : true
      })
      .then(() => {
        return create()
      })
  } else {
    return create()
  }
}

const dirname = path =>
  path
    .split('/')
    .slice(0, -1)
    .join('/')

const logAndThrow = label => err => {
  console.log(label)
  throw err
}
const forceCreateFileByPath = function(client, path, data, options) {
  const files = client.files
  let dirID
  const dirpath = dirname(path)
  return files
    .createDirectoryByPath(dirpath)
    .then(() => files.statByPath(dirpath))
    .then(dir => (dirID = dir._id))
    .then(() => files.existsByPath(path))
    .then(function(stat) {
      options = Object.assign({ dirID: dirID }, options)
      // Seems there is a bug in statByPath, this is why we need
      // the second condition
      if (!stat || stat.attributes.type != 'file') {
        return files.create(data, options).catch(logAndThrow('create'))
      } else {
        return files
          .updateById(stat._id, data, options)
          .catch(logAndThrow('updateById'))
      }
    })
    .catch(err => {
      console.log('Could not forceCreateFileByPath')
      console.log(err.reason)
      throw err
    })
}

const addUtilityMethods = function(client) {
  client.files.existsByPath = doNotThrowOn404(client.files.statByPath)
  client.files.existsById = doNotThrowOn404(client.files.statById)
  client.data.existsById = doNotThrowOn404(client.data.find)
  client.data.forceCreate = forceCreateDoc.bind(null, client)
  client.files.forceCreateByPath = forceCreateFileByPath.bind(null, client)
}

module.exports = { addUtilityMethods }
