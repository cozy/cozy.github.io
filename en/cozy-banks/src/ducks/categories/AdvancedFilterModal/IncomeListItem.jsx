import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import EyeClosedIcon from 'cozy-ui/transpiled/react/Icons/EyeClosed'
import EyeIcon from 'cozy-ui/transpiled/react/Icons/Eye'

const IncomeListItem = ({ onChange, value }) => {
  const { t } = useI18n()

  return (
    <ListItem button disableGutters onClick={onChange}>
      <ListItemIcon>
        <Icon icon={value ? EyeIcon : EyeClosedIcon} />
      </ListItemIcon>
      <ListItemText
        primary={t('Categories.filter.advancedFilters.hideIncomes')}
      />
      <ListItemSecondaryAction className="u-pr-half">
        <Checkbox checked={value} onChange={onChange} />
      </ListItemSecondaryAction>
    </ListItem>
  )
}

IncomeListItem.prototype = {
  onChange: PropTypes.func,
  value: PropTypes.bool
}

export default IncomeListItem
