import React from 'react'
import { mount } from 'enzyme'
import CategoryChoice, { getCategoriesOptions } from './CategoryChoice'
import Row from 'components/Row'
import { ChooseButton } from 'components/MultiSelect'
import { TestI18n } from 'test/AppLike'

const isSelectedRow = n => n.type() == Row && n.props().isSelected

const findSelectedRow = root => {
  return root.findWhere(isSelectedRow)
}

// Dressing category is under the Daily life parent category
const DAILY_LIFE_CATEGORY_ID = '400100'
const DRESSING_CATEGORY_ID = '400130'

describe('getCategoriesOptions', () => {
  it('should work', () => {
    const t = x => x
    const options = getCategoriesOptions(t)
    expect(options).toHaveLength(13)
    expect(options[0].children).toHaveLength(8)
  })
})

describe('CategoryChoice', () => {
  const setup = ({ categoryId, canSelectParent }) => {
    const root = mount(
      <TestI18n>
        <CategoryChoice
          canSelectParent={canSelectParent}
          categoryId={categoryId}
          onSelect={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestI18n>
    )
    return { root }
  }

  describe('when selecting a normal category', () => {
    it('should show only one selected item', () => {
      const { root } = setup({ categoryId: DRESSING_CATEGORY_ID })
      const selectedRow = findSelectedRow(root)
      expect(selectedRow.length).toBe(1)
      expect(selectedRow.text()).toBe('Everyday life')
      selectedRow.simulate('click')

      const selectedRow2 = findSelectedRow(root)
      expect(selectedRow2.length).toBe(1)
      expect(selectedRow2.text()).toBe('Dressing')
    })
  })

  describe('when selecting a "others" category', () => {
    it('should show only one selected item', () => {
      const { root } = setup({ categoryId: DAILY_LIFE_CATEGORY_ID })
      const selectedRow = findSelectedRow(root)
      expect(selectedRow.length).toBe(1)
      expect(selectedRow.text()).toBe('Everyday life')
      selectedRow.simulate('click')

      const selectedRow2 = findSelectedRow(root)
      expect(selectedRow2.length).toBe(1)
      expect(selectedRow2.text()).toBe('Others : Everyday life')
    })
  })

  describe('when allowing parent to be selected', () => {
    it('should show a ChooseButton', () => {
      const { root } = setup({
        categoryId: DRESSING_CATEGORY_ID,
        canSelectParent: true
      })
      const selectedRow = findSelectedRow(root)
      expect(selectedRow.length).toBe(1)

      const chooseBtn = selectedRow.find(ChooseButton)
      expect(chooseBtn.length).toBe(1)
      chooseBtn.props().onClick()
      expect(root.find(CategoryChoice).props().onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: DAILY_LIFE_CATEGORY_ID
        })
      )
    })
  })
})
