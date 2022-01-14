import compose from 'lodash/flowRight'

const addRev = doc => {
  return { ...doc, _rev: '1-deadbeef' }
}

const addId = doc => {
  return { ...doc, _id: doc._id || Math.random().toString() }
}

export const prepareTransactionForTest = compose(addRev, addId)
