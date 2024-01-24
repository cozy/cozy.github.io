import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Button from 'cozy-ui/transpiled/react/Buttons'
import SettingIcon from 'cozy-ui/transpiled/react/Icons/Setting'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import Badge from 'cozy-ui/transpiled/react/Badge'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'

const useStyles = makeStyles({
  badge: {
    top: '50%',
    right: '2rem'
  }
})

const AdvancedFilter = ({ onClick, selectedTagsLength, className }) => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const classes = useStyles()

  if (isMobile) {
    return (
      <List>
        <ListItem button onClick={onClick}>
          <ListItemIcon>
            <Icon icon={SettingIcon} />
          </ListItemIcon>
          <ListItemText
            primary={t('Categories.filter.advancedFilters.title')}
          />
          <Badge
            badgeContent={selectedTagsLength}
            classes={{ badge: classes.badge }}
            showZero={false}
            color="primary"
            variant="standard"
            size="medium"
          >
            <Icon icon={RightIcon} color="var(--secondaryTextColor)" />
          </Badge>
        </ListItem>
      </List>
    )
  }

  return (
    <Button
      label={t('Categories.filter.advancedFilters.title')}
      variant="text"
      onClick={onClick}
      startIcon={<Icon icon={SettingIcon} />}
      className={className}
    />
  )
}

AdvancedFilter.prototype = {
  onClick: PropTypes.func,
  hasSelectedTags: PropTypes.bool,
  className: PropTypes.string
}

export default AdvancedFilter
