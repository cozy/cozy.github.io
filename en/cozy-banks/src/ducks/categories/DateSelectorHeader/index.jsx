import React from 'react'
import Header from 'components/Header'
import styles from 'ducks/categories/CategoriesHeader/CategoriesHeader.styl'
import CategoryAccountSwitch from 'ducks/categories/CategoryAccountSwitch'

const DateSelectorHeader = ({
  dateSelector,
  selectedCategory,
  breadcrumbItems
}) => {
  return (
    <>
      <Header theme="inverted" fixed className={styles.CategoriesHeader}>
        {dateSelector}
      </Header>

      <div style={{ height: '3rem' }} />
      <CategoryAccountSwitch
        selectedCategory={selectedCategory}
        breadcrumbItems={breadcrumbItems}
      />
    </>
  )
}

export default React.memo(DateSelectorHeader)
