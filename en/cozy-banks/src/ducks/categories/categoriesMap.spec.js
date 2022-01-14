import categoriesMap, { getCategories, isParentOf } from './categoriesMap'

describe('categories map', function () {
  it('should map ids to categories', function () {
    expect(categoriesMap.get('400700').name).toBe('activities')
  })
  it('should map ids to categories 2', function () {
    expect(categoriesMap.get('400750').name).toBe('activities')
  })
  it('should map ids to categories 2', function () {
    expect(Object.keys(categoriesMap.get('400750'))).toEqual([
      'color',
      'name',
      'id',
      'children'
    ])
  })

  it('should add a "others" children to all categories', () => {
    const categories = getCategories()

    Object.keys(categories).forEach(categoryName => {
      const category = categories[categoryName]

      expect(categories[categoryName].children).toMatchObject({
        [category.id]: {
          name: `${category.name}`,
          color: category.color,
          id: category.id
        }
      })
    })
  })

  it('should be possible to know if a category is parent of another', () => {
    expect(isParentOf('400100', '400110')).toBe(true)
    expect(isParentOf('400100', '400111')).toBe(true)
    expect(isParentOf('400500', '400510')).toBe(true)
    expect(isParentOf('400100', '400510')).toBe(false)
    expect(isParentOf('400100', '400710')).toBe(false)
    expect(isParentOf('400100', '400100')).toBe(true)
  })
})
