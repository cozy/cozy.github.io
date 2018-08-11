const fetch = require('node-fetch')

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
  const response = await fetch(
    `${registryUrl}/${spaceName ? spaceName + '/' : ''}registry/${appSlug}`,
    {
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
    }
  )

  if (response.status !== 201) {
    const body = await response.json()
    throw new Error(`${response.status} ${response.statusText}: ${body.error}`)
  }

  return true
}
