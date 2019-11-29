import { isSelected, getCategoriesOptions } from './CategoryChoice'

// Dressing category is under the Daily life parent category
const DAILY_LIFE_CATEGORY_ID = '400100'
const DRESSING_CATEGORY_ID = '400130'

const dailyLifeOption = {
  id: DAILY_LIFE_CATEGORY_ID,
  name: 'dailyLife',
  children: []
}

const dressingOption = {
  id: DRESSING_CATEGORY_ID,
  name: 'dressing'
}

describe('getCategoriesOptions', () => {
  it('should work', () => {
    const t = x => x
    const options = getCategoriesOptions(t)
    expect(options).toHaveLength(13)
    expect(options[0].children).toHaveLength(8)
  })
})

describe('is selected logic', () => {
  it('should mark a category as selected if one of its children is selected', () => {
    expect(isSelected(dailyLifeOption, dressingOption, 0)).toBe(true)
  })

  it('should mark a category as selected if it is selected', () => {
    expect(isSelected(dailyLifeOption, dailyLifeOption, 1)).toBe(true)
  })

  it('should not mark a category as selected if they are not related', () => {
    expect(
      isSelected(
        {
          id: DAILY_LIFE_CATEGORY_ID
        },
        {
          id: 1337
        },
        0
      )
    ).toBe(false)
  })
})
