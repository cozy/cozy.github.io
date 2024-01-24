import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { DialogSection, DialogListItem } from 'components/DialogSections'
import { CategoryIcon, getCategoryName } from 'ducks/categories'
import List from 'cozy-ui/transpiled/react/List'

const DumbCategorySection = ({ value, label, onClick }) => {
  const { t } = useI18n()
  const categoryName = getCategoryName(value.id)

  const translatedCategoryName = t(
    `Data.${value.isParent ? 'categories' : 'subcategories'}.${categoryName}`
  )

  return (
    <DialogSection label={label}>
      <List>
        <DialogListItem
          icon={<CategoryIcon categoryId={value.id} />}
          label={
            value.isParent
              ? t('Settings.budget-category-alerts.edit.all-category', {
                  categoryName: translatedCategoryName
                })
              : translatedCategoryName
          }
          onClick={onClick}
          hasArrow={true}
        />
      </List>
    </DialogSection>
  )
}

const CategorySection = DumbCategorySection

export default CategorySection
