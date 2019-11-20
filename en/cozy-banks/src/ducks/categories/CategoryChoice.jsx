import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'cozy-ui/react'
import PopupSelect from 'components/PopupSelect'
import MultiSelect from 'components/MultiSelect'
import {
  getCategories,
  CategoryIcon,
  getParentCategory
} from 'ducks/categories'
import styles from 'ducks/transactions/TransactionModal.styl'

export const getOptions = (categories, subcategory = false, t) => {
  return Object.keys(categories).map(catName => {
    const option = categories[catName]

    const translateKey = subcategory ? 'subcategories' : 'categories'
    option.title = t(`Data.${translateKey}.${option.name}`)
    option.icon = <CategoryIcon categoryId={option.id} />

    if (!subcategory) {
      // sort children so "others" is always the last
      option.children = getOptions(option.children, true, t).sort(a => {
        if (a.id === option.id) {
          return 1
        } else {
          return -1
        }
      })
    }

    return option
  })
}

export const getCategoriesOptions = t => getOptions(getCategories(), false, t)

class CategoryChoice extends Component {
  constructor(props) {
    super(props)

    this.options = {
      children: getCategoriesOptions(props.t),
      title: props.t('Categories.choice.title')
    }
  }

  isSelected = (categoryOption, level) => {
    const { categoryId: selectedCategoryId } = this.props
    const selectedCategoryParentName = getParentCategory(selectedCategoryId)
    const isSelectedParentCategory =
      selectedCategoryParentName === categoryOption.name
    const isSelectedCategory = selectedCategoryId === categoryOption.id

    return level === 0 ? isSelectedParentCategory : isSelectedCategory
  }

  render() {
    const { t, onCancel, onSelect, modal, canSelectParent } = this.props

    const Component = modal ? PopupSelect : MultiSelect
    return (
      <Component
        closeBtnClassName={styles.TransactionModalCross}
        title={t('Categories.choice.title')}
        options={this.options}
        isSelected={this.isSelected}
        canSelectParent={canSelectParent}
        onSelect={subcategory => onSelect(subcategory)}
        onCancel={onCancel}
      />
    )
  }
}

CategoryChoice.propTypes = {
  categoryId: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  /** Whether categoryChoice should be shown in a modal */
  modal: PropTypes.bool
}

CategoryChoice.defaultProps = {
  modal: true
}

export default translate()(CategoryChoice)
