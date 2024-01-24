import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'

const useStyles = makeStyles({
  desktopListItem: {
    paddingLeft: '2rem',
    paddingRight: '2rem'
  }
})

const TagCreateListItem = ({ setIsCreateModalOpened }) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const { t } = useI18n()
  return (
    <ListItem
      button
      onClick={setIsCreateModalOpened}
      className={!isMobile ? styles.desktopListItem : null}
    >
      <ListItemIcon>
        <Icon icon={PlusIcon} />
      </ListItemIcon>
      <ListItemText>{t('Tag.add-new-tag')}</ListItemText>
    </ListItem>
  )
}

TagCreateListItem.propTypes = {
  setIsCreateModalOpened: PropTypes.func.isRequired
}

export default TagCreateListItem
