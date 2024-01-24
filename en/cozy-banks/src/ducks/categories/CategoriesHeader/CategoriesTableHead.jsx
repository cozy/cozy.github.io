import React from 'react'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import catStyles from 'ducks/categories/styles.styl'
import PropTypes from 'prop-types'
const stAmount = catStyles['bnk-table-amount']
const stCategory = catStyles['bnk-table-category-category']
const stPercentage = catStyles['bnk-table-percentage']
const stTotal = catStyles['bnk-table-total']

const CategoriesTableHead = ({ selectedCategory }) => {
  const { isDesktop, isTablet } = useBreakpoints()
  const { t } = useI18n()
  return (
    <thead>
      <tr>
        <td className={stCategory}>
          {selectedCategory
            ? t('Categories.headers.subcategories')
            : t('Categories.headers.categories')}
        </td>
        {(isDesktop || isTablet) && (
          <td className={catStyles['bnk-table-operation']}>
            {t('Categories.headers.transactions.plural')}
          </td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.credit')}</td>
        )}
        {isDesktop && (
          <td className={stAmount}>{t('Categories.headers.debit')}</td>
        )}
        <td className={stTotal}>{t('Categories.headers.total')}</td>
        <td className={stPercentage}>%</td>
      </tr>
    </thead>
  )
}

CategoriesTableHead.propTypes = {
  selectedCategory: PropTypes.object
}

export default CategoriesTableHead
