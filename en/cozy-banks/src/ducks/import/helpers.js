import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import keyBy from 'lodash/keyBy'
import merge from 'lodash/merge'
import set from 'lodash/set'
import uniqWith from 'lodash/uniqWith'

export const fullDateStr = dateStr => (dateStr ? `${dateStr}T12:00:00Z` : '')

export const withExistingDocIds = (
  docsToSave,
  { existingDocs, matchingProperty }
) => {
  return docsToSave.map(doc => {
    const existingDoc = existingDocs.find(
      existingDoc => existingDoc[matchingProperty] === doc[matchingProperty]
    )
    if (existingDoc) {
      return { ...doc, _id: existingDoc._id, _rev: existingDoc._rev }
    }
    return doc
  })
}

export const reconciliate = (newDocs, existingDocs, idFn) => {
  const reconciliatedById = keyBy(existingDocs, idFn)

  for (const attributes of newDocs) {
    const id = idFn(attributes)
    reconciliatedById[id] = merge(reconciliatedById[id], attributes)
  }

  return Object.values(reconciliatedById)
}

export const addRelationship = (doc, relationshipName, definition) => {
  const isArray = Array.isArray(definition)
  const relationship = ['relationships', relationshipName, 'data']

  const existingRelationship = get(doc, relationship, [])
  const newRelationship = isArray
    ? uniqWith(
        existingRelationship.concat(
          definition.map(({ _id, _type }) => ({ _id, _type }))
        ),
        isEqual
      )
    : { _id: definition._id, _type: definition._type }

  set(doc, relationship, newRelationship)
}

const TODAY = new Date().toISOString()

const ensureMetadata = doc =>
  doc.metadata
    ? doc
    : { ...doc, metadata: { dateImport: TODAY, vendor: 'cozy' } }

export const withMetadata = client => doc =>
  ensureMetadata(client.ensureCozyMetadata(doc))
