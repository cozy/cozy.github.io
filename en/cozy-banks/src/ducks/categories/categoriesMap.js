// Map instance for categories

/*
  Categories
*/

import memoize from 'lodash/memoize'

import tree from './tree'
import categoryColors from 'ducks/categories/colors'

export const getCategoryIdFromName = memoize(name =>
  Object.keys(tree).find(id => tree[id] === name)
)

export const categoriesStyle = {}
for (const catName in categoryColors) {
  const category = {}
  category.color = categoryColors[catName]
  category.name = catName
  category.id = getCategoryIdFromName(catName)
  category.children = {}
  categoriesStyle[catName] = category
}

export const getCategories = () => {
  return categoriesStyle
}

export const getCategoryName = id => {
  const undefinedId = 0

  if (id === null) {
    return 'awaiting'
  }

  if (id === undefined) {
    return tree[undefinedId]
  }

  const categoryName = tree[id]
  if (categoryName === undefined) {
    return tree[undefinedId]
  }

  return categoryName
}

const getOptions = function (idStr) {
  let k = parseInt(idStr, 10)
  let m = 10
  let name = tree[k]
  // eslint-disable-next-line
  while (!categoriesStyle.hasOwnProperty(name)) {
    k = k - (k % m)
    name = tree[k]
    m = 10 * m
  }
  return categoriesStyle[name]
}

export const categoryToParent = new Map(
  Object.keys(tree).map(id => {
    const options = getOptions(id)
    return [id, options]
  })
)

export const getParentCategory = catId => {
  const parent = categoryToParent.get(catId)
  return parent && parent.name
}

export const isParentOf = (possibleParentCatId, catId) => {
  const parent = categoryToParent.get(catId)
  return Boolean(parent && parent.id == possibleParentCatId)
}

Object.keys(tree).forEach(catId => {
  const catName = tree[catId]
  const parentName = getParentCategory(catId)

  if (categoriesStyle[parentName]) {
    categoriesStyle[parentName].children[catId] = {
      name: catName,
      color: categoriesStyle[parentName].color,
      id: catId
    }
  }
})

export default categoryToParent
