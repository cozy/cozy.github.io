import React from 'react'
import PropTypes from 'prop-types'
import Icon from 'cozy-ui/transpiled/react/Icon'
import categoryIcons from 'ducks/categories/icons'
import {
  getParentCategory,
  getCategoryName
} from 'ducks/categories/categoriesMap'
import PendingCategoryIcon from 'ducks/categories/PendingCategoryIcon'

const getCategoryIcon = categoryId => {
  let categoryName = getCategoryName(categoryId)
  const catIcon = categoryIcons[categoryName]
  if (catIcon) {
    return catIcon
  } else {
    const parentCategoryName = getParentCategory(categoryId)
    const pIcon = categoryIcons[parentCategoryName]
    if (pIcon) {
      return pIcon
    }
  }
  return categoryIcons.uncategorized
}

const CategoryIcon = ({ categoryId, size, ...rest }) => {
  if (!categoryId) {
    return <PendingCategoryIcon size={size} {...rest} />
  }

  const icon = getCategoryIcon(categoryId)
  if (!icon) {
    return null
  }
  return <Icon icon={icon} size={size} {...rest} />
}

CategoryIcon.propTypes = {
  categoryId: PropTypes.string,
  size: PropTypes.number
}

CategoryIcon.defaultProps = {
  size: 32
}

export default CategoryIcon
