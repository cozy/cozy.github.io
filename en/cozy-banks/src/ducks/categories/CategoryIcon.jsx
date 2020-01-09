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

const CategoryIcon = ({ categoryId, ...rest }) => {
  if (!categoryId) {
    return <PendingCategoryIcon size={32} {...rest} />
  }

  const icon = getCategoryIcon(categoryId)
  if (!icon) {
    return null
  }
  return <Icon icon={icon} width={32} height={32} {...rest} />
}

CategoryIcon.propTypes = {
  categoryId: PropTypes.string
}

export default CategoryIcon
