import categoriesMap, { getCategories } from './categoriesMap'

describe('categories map', function() {
  it('should map ids to categories', function() {
    expect(categoriesMap.get('400700').name).toBe('activities')
  })
  it('should map ids to categories 2', function() {
    expect(categoriesMap.get('400750').name).toBe('activities')
  })
  it('should map ids to categories 2', function() {
    expect(Object.keys(categoriesMap.get('400750'))).toEqual([
      'color',
      'name',
      'id',
      'children'
    ])
  })

  xit('should add a "others" children to all categories', () => {
    const categories = getCategories()

    Object.keys(categories).forEach(categoryName => {
      const category = categories[categoryName]

      expect(categories[categoryName].children).toMatchObject({
        [category.id]: {
          name: `${category.name}Others`,
          color: category.color,
          id: category.id
        }
      })
    })
  })
})
