import startCase from 'lodash/startCase'

export const prettyLabel = label => {
  return startCase(label.toLowerCase())
}

export const getCategories = bundle => {
  return bundle.categoryId.split(' / ')[0]
}
