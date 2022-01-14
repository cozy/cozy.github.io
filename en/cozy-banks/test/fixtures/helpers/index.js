const { freshDate } = require('./freshDate')
const linxoCategories = require('../linxo-categories')

function inverseObject(obj) {
  const out = {}
  Object.keys(obj).forEach(function (k) {
    out[obj[k]] = k
  })
  return out
}

const categoryNameToId = inverseObject(linxoCategories)

module.exports = {
  helpers: {
    categoryId: function (catName) {
      return categoryNameToId[catName]
    },
    freshDate
  }
}
