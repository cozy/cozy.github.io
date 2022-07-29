import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import makeStyles from 'cozy-ui/transpiled/react/helpers/makeStyles'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import ListItem from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/MuiCozyTheme/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

import { useHistory } from 'components/RouterContext'
import { countTransactions } from 'components/Tag/helpers'

const useStyles = makeStyles({
  desktopListItem: {
    paddingLeft: '2rem',
    paddingRight: '2rem'
  }
})

const TagListItem = ({ tag }) => {
  const { isMobile } = useBreakpoints()
  const styles = useStyles()
  const { t } = useI18n()
  const history = useHistory()

  const handleListItemClick = () => {
    history.push(`tag/${tag._id}`)
  }

  return (
    <ListItem
      button
      onClick={handleListItemClick}
      className={!isMobile ? styles.desktopListItem : null}
    >
      <ListItemIcon>
        <Icon icon={TagIcon} />
      </ListItemIcon>
      <ListItemText
        primary={tag.label}
        secondary={t('Tag.transactions', {
          smart_count: countTransactions(tag)
        })}
      />
      <Icon icon={RightIcon} color="var(--secondaryTextColor)" />
    </ListItem>
  )
}

TagListItem.propTypes = {
  tag: PropTypes.object.isRequired
}

export default TagListItem
