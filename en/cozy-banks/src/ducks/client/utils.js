import keyBy from 'lodash/keyBy'
import omit from 'lodash/omit'

/**
 * All this file should be moved to cozy-client
 */

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
 * Revokes all clients with the given softwareID apart from the current one
 *
 * @param  {CozyCLient} client
 * @param  {string} softwareID
 * @return {Promise}
 */
export const revokeOtherOAuthClientsForSoftwareId = async (
  client,
  softwareID
) => {
  const { data: clients } = await client.stackClient.fetchJSON(
    'GET',
    `/settings/clients`
  )
  const currentOAuthClientId = client.stackClient.oauthOptions.clientID
  const otherOAuthClients = clients.filter(
    oauthClient =>
      oauthClient.attributes.software_id === softwareID &&
      oauthClient.id !== currentOAuthClientId
  )
  for (let oauthClient of otherOAuthClients) {
    await client.stackClient.fetchJSON(
      'DELETE',
      `/settings/clients/${oauthClient.id}`
    )
  }
}

/**
 * Destroys every document of a particular doctype
 */
export const dropDoctype = async (client, doctype) => {
  const col = client.collection(doctype)
  const { data: docs } = await col.getAll()
  if (docs.length > 0) {
    // The omit for _type can be removed when the following PR is resolved
    // https://github.com/cozy/cozy-client/pull/597
    await col.destroyAll(docs.map(doc => omit(doc, '_type')))
  }
}

export const getDocumentID = doc => doc._id

export const importACHData = async (client, achData) => {
  for (const [doctype, documents] of Object.entries(achData)) {
    const col = client.collection(doctype)
    const existingIds = documents.map(getDocumentID).filter(Boolean)
    const existingDocsResp = await col.getAll(existingIds)
    const existingDocs = keyBy(
      existingDocsResp.data.map(x => omit(x, '_type')),
      getDocumentID
    )
    const updatedDocs = documents.map(x => {
      const existing = existingDocs[x._id]
      const updatedDoc = { ...existing, ...x }
      return updatedDoc
    })
    const responses = await col.updateAll(updatedDocs)
    const errors = responses.filter(resp => resp.error)
    if (errors.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Errors while importing data', errors)
    }
  }
}

export const getDocumentIdentity = doc =>
  doc
    ? {
        _id: doc._id,
        _type: doc._type
      }
    : null
