// Map instance for categories

/*
  Categories
*/

import tree from './tree'
import isNode from 'detect-node'
import palette from 'cozy-ui/react/palette'
import { getCssVariableValue } from 'cozy-ui/react/utils/color'

const getColor = color => (isNode ? palette[color] : getCssVariableValue(color))

export const categoriesStyle = {
  kids: {
    color: getColor('azure')
  },
  dailyLife: {
    color: getColor('melon')
  },
  educationAndTraining: {
    color: getColor('blazeOrange')
  },
  health: {
    color: getColor('pomegranate')
  },
  homeAndRealEstate: {
    color: getColor('mango')
  },
  incomeCat: {
    color: getColor('emerald')
  },
  activities: {
    // TODO: remove value after fuchsia is not overload by cozy-authentication
    // https://github.com/cozy/cozy-ui/issues/762
    color: getColor('fuchsia') || '#FC4C83'
  },
  excludeFromBudgetCat: {
    color: getColor('darkPeriwinkle')
  },
  services: {
    color: getColor('purpley')
  },
  tax: {
    color: getColor('lightishPurple')
  },
  transportation: {
    color: getColor('puertoRico')
  },
  goingOutAndTravel: {
    color: getColor('weirdGreen')
  },
  uncategorized: {
    color: getColor('coolGrey')
  }
}

export const getCategoryIdFromName = name =>
  Object.keys(tree).find(id => tree[id] === name)

for (const catName in categoriesStyle) {
  const category = categoriesStyle[catName]
  category.name = catName
  category.id = getCategoryIdFromName(catName)
  category.children = {}
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

const getOptions = function(idStr) {
  let k = parseInt(idStr, 10)
  let m = 10
  let name = tree[k]
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
