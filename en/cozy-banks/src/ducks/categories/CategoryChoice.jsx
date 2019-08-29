import React, { Component } from 'react'
import { translate } from 'cozy-ui/react'
import PopupSelect from 'components/PopupSelect'
import {
  getCategories,
  CategoryIcon,
  getParentCategory
} from 'ducks/categories'
import styles from 'ducks/transactions/TransactionModal.styl'

class CategoryChoice extends Component {
  constructor(props) {
    super(props)

    this.options = {
      children: this.getOptions(getCategories()),
      title: props.t('Categories.choice.title')
    }
  }

  getOptions = (categories, subcategory = false) => {
    return Object.keys(categories).map(catName => {
      const option = categories[catName]

      const translateKey = subcategory ? 'subcategories' : 'categories'
      option.title = this.props.t(`Data.${translateKey}.${option.name}`)
      option.icon = <CategoryIcon categoryId={option.id} />

      if (!subcategory) {
        // sort children so "others" is always the last
        option.children = this.getOptions(option.children, true).sort(a => {
          if (a.id === option.id) {
            return 1
          }

          return 0
        })
      }

      return option
    })
  }

  isSelected = categoryToCheck => {
    const { categoryId: selectedCategoryId } = this.props
    const selectedCategoryParentName = getParentCategory(selectedCategoryId)
    const isSelectedParentCategory =
      selectedCategoryParentName === categoryToCheck.name
    const isSelectedCategory = selectedCategoryId === categoryToCheck.id

    return isSelectedParentCategory || isSelectedCategory
  }

  render() {
    const { t, onCancel, onSelect } = this.props

    return (
      <PopupSelect
        closeBtnClassName={styles.TransactionModalCross}
        title={t('Categories.choice.title')}
        options={this.options}
        isSelected={this.isSelected}
        onSelect={subcategory => onSelect(subcategory)}
        onCancel={onCancel}
      />
    )
  }
}

export default translate()(CategoryChoice)
