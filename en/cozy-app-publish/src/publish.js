const fs = require('fs')
const path = require('path')

const { DEFAULT_SPACE_NAME } = require('./constants')

const getFullRegistryUrl = (baseRegistryUrl, spaceName, appSlug) => {
  const spaceNameFragment =
    spaceName && spaceName !== DEFAULT_SPACE_NAME ? `${spaceName}/` : ''

  const url = `${baseRegistryUrl}/${spaceNameFragment}registry/${appSlug}`

  return url
}

module.exports = async ({
  registryUrl,
  registryEditor,
  registryToken,
  spaceName,
  appSlug,
  appVersion,
  appBuildUrl,
  appBuildFile,
  sha256Sum,
  appType
}) => {
  const url = getFullRegistryUrl(registryUrl, spaceName, appSlug)
  const headers = { Authorization: `Token ${registryToken}` }
  let body = JSON.stringify({
    editor: registryEditor,
    version: appVersion,
    url: appBuildUrl,
    sha256: sha256Sum,
    type: appType
  })
  if (appBuildFile) {
    // the registry stores the uploaded archive instead of downloading it
    const form = new FormData()
    form.append('metadata', body)
    form.append(
      'tarball',
      await fs.openAsBlob(appBuildFile),
      path.basename(appBuildFile)
    )
    body = form
  } else {
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(url, { method: 'POST', headers, body })

  if (response.status === 404) {
    const text = await response.text()
    throw new Error(text)
  } else if (response.status !== 201) {
    let errorMsg
    let resp2 = response.clone()
    try {
      const body = await response.json()
      errorMsg = body.error
    } catch (_e) {
      errorMsg = await resp2.text()
    }
    throw new Error(`${response.status} ${response.statusText}: ${errorMsg}`)
  }

  return response
}
