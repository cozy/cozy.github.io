import React, { Component } from 'react'
import PropTypes from 'prop-types'
import sortBy from 'lodash/sortBy'
import Fuse from 'fuse.js/dist/fuse.js'

import NestedSelect, {
  NestedSelectModal
} from 'cozy-ui/transpiled/react/NestedSelect'
import { translate } from 'cozy-ui/transpiled/react/providers/I18n'

import {
  CategoryIcon,
  getCategories,
  getParentCategory
} from 'ducks/categories'
import styles from 'ducks/transactions/TransactionModal/TransactionModal.styl'
import flatten from 'lodash/flatten'
import { formatSearchResult, fuseOptions } from './search/helpers'

export const getOptions = (categories, subcategory = false, t) => {
  return Object.keys(categories).map(catName => {
    const option = categories[catName]

    const translateKey = subcategory ? 'subcategories' : 'categories'
    option.title = t(`Data.${translateKey}.${option.name}`)
    option.icon = <CategoryIcon categoryId={option.id} />

    if (!subcategory) {
      // Sort children so "others" is always the last.
      // "others" is the parent category.
      const isOther = item => item.id === option.id
      const alphabetical = item => item.title
      option.children = sortBy(getOptions(option.children, true, t), [
        isOther,
        alphabetical
      ])
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

    const { t } = props
    const childrenOptions = getCategoriesOptions(t)
    this.options = {
      children: childrenOptions,
      title: t('Categories.choice.title')
    }
    this.fuse = new Fuse(
      flatten(childrenOptions.map(e => e.children)),
      fuseOptions
    )

    this.searchOptions = {
      placeholderSearch: t('Categories.search.title'),
      noDataLabel: t('Categories.search.no-category'),
      onSearch: this.onSearch
    }
    this.state = {
      value: ''
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

  onSearch = value => {
    const t = this.props.t
    const result = this.fuse.search(value)
    this.setState({ searchValue: value })
    return formatSearchResult(t, result)
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
        onClose={onCancel}
        searchOptions={this.searchOptions}
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
