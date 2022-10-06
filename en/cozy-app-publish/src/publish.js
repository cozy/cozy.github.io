const fetch = require('node-fetch')
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
  sha256Sum,
  appType
}) => {
  const url = getFullRegistryUrl(registryUrl, spaceName, appSlug)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${registryToken}`
    },
    body: JSON.stringify({
      editor: registryEditor,
      version: appVersion,
      url: appBuildUrl,
      sha256: sha256Sum,
      type: appType
    })
  })

  if (response.status === 404) {
    const text = await response.text()
    throw new Error(text)
  } else if (response.status !== 201) {
    let errorMsg
    let resp2 = response.clone()
    try {
      const body = await response.json()
      errorMsg = body.error
    } catch (e) {
      errorMsg = await resp2.text()
    }
    throw new Error(`${response.status} ${response.statusText}: ${errorMsg}`)
  }

  return response
}
