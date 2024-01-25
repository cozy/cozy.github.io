import React, { useCallback } from 'react'
import cx from 'classnames'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Switch from 'cozy-ui/transpiled/react/Switch'
import styles from 'ducks/categories/CategoriesHeader/CategoriesHeader.styl'

const IncomeToggle = ({ withIncome, onToggle }) => {
  const { variant } = useCozyTheme()
  const { t } = useI18n()

  const handleChange = useCallback(
    ev => {
      onToggle(ev.target.checked)
    },
    [onToggle]
  )

  return (
    <div className={cx(styles.CategoriesHeader__Toggle, styles[variant])}>
      <Switch
        id="withIncome"
        disableRipple
        checked={withIncome}
        color="secondary"
        onChange={handleChange}
      />
      <label htmlFor="withIncome">{t('Categories.filter.includeIncome')}</label>
    </div>
  )
}

export default React.memo(IncomeToggle)
