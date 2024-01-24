import React from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import { useI18n } from 'cozy-ui/transpiled/react/providers/I18n'
import { makeStyles } from 'cozy-ui/transpiled/react/styles'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import TagIcon from 'cozy-ui/transpiled/react/Icons/Tag'

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
  const navigate = useNavigate()

  const handleListItemClick = () => {
    navigate(`/tag/${tag._id}`)
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
