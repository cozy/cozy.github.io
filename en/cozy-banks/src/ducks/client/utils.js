/**
 * All this file should be moved to cozy-client
 */

export const isCollectionLoading = col => {
  if (!col) {
    console.warn('isCollectionLoading called on falsy value.') // eslint-disable-line no-console
    return false
  }
  return col.fetchStatus === 'loading' || col.fetchStatus === 'pending'
}

export const hasBeenLoaded = col => {
  return col.lastFetch
}

export const associateDocuments = (
  originalDocument,
  associationName,
  associationDoctype,
  documentsToAssociate
) => {
  const ids = documentsToAssociate.map(doc => doc.id)

  originalDocument[associationName] = {
    data: documentsToAssociate,
    doctype: associationDoctype,
    name: associationName,
    raw: ids,
    target: {
      ...originalDocument,
      [associationName]: ids
    }
  }

  return originalDocument
}

export const isRevoked = async client => {
  try {
    await client.stackClient.fetchInformation()
    return false
  } catch (err) {
    if (err.message && err.message.indexOf('Client not found') > -1) {
      return true
    } else {
      return false
    }
  }
}

export const checkForRevocation = async client => {
  const revoked = await isRevoked(client)
  if (revoked) {
    client.stackClient.unregister()
    client.handleRevocationChange(true)
  }
}

/**
 * Updates the device notification token
 *
 * @param  {CozyClient} client
 * @param  {String} token  - Device token, from Cordova Push Plugin
 */
export const updateNotificationToken = (client, token) => {
  // Updates local and remote information
  const clientInfos = client.stackClient.oauthOptions
  client.stackClient.updateInformation({
    ...clientInfos,
    notificationDeviceToken: token
  })
}

/**
 * Get current device notification token
 *
 * @param  {CozyClient} client
 * @param  {String} token  - Device token, from Cordova Push Plugin
 */
export const getNotificationToken = client => {
  return client.stackClient.oauthOptions.notification_device_token
}

export const getDocumentIdentity = doc =>
  doc
    ? {
        _id: doc._id,
        _type: doc._type
      }
    : null
