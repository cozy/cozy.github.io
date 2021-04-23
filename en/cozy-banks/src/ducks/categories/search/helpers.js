import { getParentCategory } from '../categoriesMap'

export const fuseOptions = {
  keys: ['title'],
  threshold: 0.2
}

export const formatSearchResult = (t, result) => {
  return result
    .map(r => r.item)
    .map(item => {
      const parentName = getParentCategory(item.id)
      return { description: t(`Data.categories.${parentName}`), ...item }
    })
}
