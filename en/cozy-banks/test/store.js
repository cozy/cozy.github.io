import { createStore } from 'redux'
import mapValues from 'lodash/mapValues'
import keyBy from 'lodash/keyBy'

const store = createStore(() => ({
  mobile: {
    url: 'cozy-url://'
  }
}))

const normalizeDoc = (doc, _type) => ({
  ...doc,
  id: doc.id || doc._id,
  _id: doc.id || doc._id,
  _type
})

export const normalizeData = data =>
  mapValues(data, (docs, doctype) =>
    keyBy(
      docs.map(doc => normalizeDoc(doc, doctype)),
      '_id'
    )
  )

export default store
