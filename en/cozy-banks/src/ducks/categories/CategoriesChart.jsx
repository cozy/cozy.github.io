import React, { useMemo } from 'react'
import Chart from 'ducks/categories/Chart'
import styles from 'ducks/categories/CategoriesChart.styl'
import { FigureBlock } from 'cozy-ui/transpiled/react/Figure'
import sortBy from 'lodash/sortBy'
import cx from 'classnames'
import { getCurrencySymbol } from 'utils/currencySymbol'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import CozyTheme, {
  useCozyTheme
} from 'cozy-ui/transpiled/react/providers/CozyTheme'

const hexToRGBA = (hex, a) => {
  const cutHex = hex.substring(1)
  const r = parseInt(cutHex.substring(0, 2), 16)
  const g = parseInt(cutHex.substring(2, 4), 16)
  const b = parseInt(cutHex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const getCategoriesColors = (categories, selectedCategory) => {
  if (selectedCategory === undefined) {
    return categories.map(category => category.color)
  }

  const alphaDiff = 0.7 / categories.length

  return categories.map((category, index) =>
    hexToRGBA(selectedCategory.color, 1 - alphaDiff * index)
  )
}

const getSortedCategories = categories => {
  const sortedCategories = sortBy(categories, category =>
    Math.abs(category.amount)
  ).reverse()

  return sortedCategories
}

const CategoriesChart = props => {
  const {
    categories,
    selectedCategory,
    width,
    height,
    total,
    currency,
    hasAccount,
    className,
    label
  } = props

  const { t } = useI18n()
  const { variant } = useCozyTheme()

  const sortedCategories = useMemo(
    () => getSortedCategories(categories),
    [categories]
  )
  const colors = useMemo(
    () => getCategoriesColors(sortedCategories, selectedCategory),
    [selectedCategory, sortedCategories]
  )

  const labels = sortedCategories.map(category =>
    t(
      `Data.${selectedCategory ? 'subcategories' : 'categories'}.${
        category.name
      }`
    )
  )
  const data = sortedCategories.map(category =>
    Math.abs(category.amount).toFixed(2)
  )

  if (categories.length === 0) return null

  return (
    <div
      className={cx(styles.CategoriesChart, styles[variant], {
        [styles.NoAccount]: !hasAccount,
        [className]: className
      })}
    >
      <CozyTheme variant="normal">
        <div className={styles.CategoriesChart__FigureBlockContainer}>
          <FigureBlock
            label={label}
            total={total}
            symbol={getCurrencySymbol(currency)}
            signed
            className={styles.CategoriesChart__FigureBlock}
            figureClassName={styles.CategoriesChart__Figure}
            withCurrencySpacing={false}
          />
        </div>
      </CozyTheme>
      {hasAccount && (
        <Chart
          labels={labels}
          data={data}
          colors={colors}
          width={width}
          height={height}
        />
      )}
    </div>
  )
}

export default CategoriesChart
