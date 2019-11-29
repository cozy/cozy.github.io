import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { NestedSelect, NestedSelectModal, translate } from 'cozy-ui/react'
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

export const isSelected = (toCheck, selected, level) => {
  const selectedCategoryParentName = getParentCategory(selected.id)
  const isSelectedParentCategory =
    selectedCategoryParentName === toCheck.name && toCheck.children
  const isSelectedCategory =
    selected.id === toCheck.id &&
    (toCheck.isParent ? selected.isParent : !selected.isParent)
  return Boolean(level === 0 ? isSelectedParentCategory : isSelectedCategory)
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

  transformParentItem = item => {
    const { t } = this.props
    return {
      ...item,
      isParent: true,
      title: t('Categories.choice.select-all')
    }
  }

  isSelected = (categoryItem, level) => {
    const { categoryId, categoryIsParent } = this.props
    const selected = { id: categoryId, isParent: categoryIsParent }
    return isSelected(categoryItem, selected, level)
  }

  render() {
    const { t, onCancel, onSelect, modal, canSelectParent } = this.props

    const Component = modal ? NestedSelectModal : NestedSelect
    return (
      <Component
        closeBtnClassName={styles.TransactionModalCross}
        title={t('Categories.choice.title')}
        options={this.options}
        isSelected={this.isSelected}
        canSelectParent={canSelectParent}
        transformParentItem={this.transformParentItem}
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
